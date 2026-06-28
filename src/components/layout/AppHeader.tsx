import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, User, ChevronDown, Globe, ChevronLeft, ChevronRight,
  Home, ExternalLink, Maximize, ZoomIn, ZoomOut, PanelLeftClose, PanelLeftOpen,
  Calendar, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { setToken, apiFetch } from "@/api/client";
import { useLang } from "@/hooks/useLang";
import { txRole } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AppHeaderProps {
  userRole?: string;
  userName?: string;
  avatarUrl?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

// Keep zoom level in module scope so it persists across renders
let _zoomLevel = 1;

export function AppHeader({ userRole = "Staff", userName = "User", avatarUrl, onToggleSidebar, isSidebarOpen }: AppHeaderProps) {
  const navigate = useNavigate();
  const { lang, toggleLang, isArabic } = useLang();
  const [zoomLevel, setZoomLevel] = useState(_zoomLevel);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    setToken(null);
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  const applyZoom = (level: number) => {
    const clamped = Math.min(2, Math.max(0.5, level));
    _zoomLevel = clamped;
    setZoomLevel(clamped);
    (document.body.style as any).zoom = clamped.toString();
  };

  const handleZoomIn = () => applyZoom(zoomLevel + 0.1);
  const handleZoomOut = () => applyZoom(zoomLevel - 0.1);

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const handleNewTab = () => window.open(window.location.href, "_blank");
  const handleHome = () => navigate("/dashboard");

  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch today's appointments for reminders
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["appointments", "reminders", todayStr],
    queryFn: () => apiFetch<any[]>(`/appointments?date=${todayStr}`),
    staleTime: 60_000,
  });

  const upcoming = appointments
    .filter((a: any) => a.status === "Scheduled")
    .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
    .slice(0, 5);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <header
      className="h-16 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 gap-3"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Left: sidebar toggle + back/forward + date */}
      <div className="flex items-center gap-1">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground mr-1"
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)} title={lang === "ar" ? "رجوع" : "Go back"}>
          {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate(1)} title={lang === "ar" ? "للأمام" : "Go forward"}>
          {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
        <span className="text-sm text-muted-foreground hidden lg:block ms-3">{today}</span>
      </div>

      {/* Right: Tools + Lang + Bell + Profile */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleHome} title="Home Page">
            <Home className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleFullScreen} title="Full Screen">
            <Maximize className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleNewTab} title="New Tab">
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleZoomIn}
            title={`Zoom In (${Math.round(zoomLevel * 100)}%)`}
            disabled={zoomLevel >= 2}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleZoomOut}
            title={`Zoom Out (${Math.round(zoomLevel * 100)}%)`}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Language Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground text-xs font-medium h-8 px-3 hidden sm:flex"
          onClick={toggleLang}
          title={lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === "en" ? "EN" : "عربي"}</span>
        </Button>

        {/* Reminders / Notifications bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground h-8 w-8" title="Reminders">
              <Bell className="w-4 h-4" />
              {upcoming.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
                  {upcoming.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">
                {lang === "ar" ? "تذكيرات اليوم" : "Today's Reminders"}
              </span>
            </div>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 opacity-30" />
                <p className="text-xs">{lang === "ar" ? "لا توجد مواعيد اليوم" : "No appointments scheduled today"}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border max-h-72 overflow-y-auto">
                {upcoming.map((appt: any) => (
                  <li
                    key={appt.id}
                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate("/appointments")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{appt.patientName ?? "Patient"}</p>
                        <p className="text-xs text-muted-foreground truncate">{appt.reason}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[11px] font-mono text-primary">{formatTime(appt.appointmentDate)}</span>
                          {appt.priorityLevel === "High" && (
                            <span className="flex items-center gap-0.5 text-[10px] text-destructive font-medium">
                              <AlertCircle className="w-3 h-3" /> High
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-4 py-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs text-primary" onClick={() => navigate("/appointments")}>
                {lang === "ar" ? "عرض جميع المواعيد" : "View all appointments"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-3 border-l border-border hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-none">{userName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{txRole(userRole, lang)}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              {lang === "ar" ? "ملفي الشخصي" : "My Profile"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              {lang === "ar" ? "تسجيل الخروج" : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
