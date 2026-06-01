import { useNavigate } from "react-router-dom";
import { 
  Bell, User, ChevronDown, Globe, ChevronLeft, ChevronRight,
  Home, ExternalLink, Maximize, ZoomIn, ZoomOut, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { setToken } from "@/api/client";
import { useLang } from "@/hooks/useLang";
import { txRole } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  userRole?: string;
  userName?: string;
  avatarUrl?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function AppHeader({ userRole = "Staff", userName = "User", avatarUrl, onToggleSidebar, isSidebarOpen }: AppHeaderProps) {
  const navigate = useNavigate();
  const { lang, toggleLang, isArabic } = useLang();

  const handleLogout = () => {
    setToken(null);
    navigate("/login", { replace: true });
  };

  const handleZoomIn = () => {
    const currentZoom = parseFloat(document.body.style.zoom || "1");
    document.body.style.zoom = (currentZoom + 0.1).toString();
  };

  const handleZoomOut = () => {
    const currentZoom = parseFloat(document.body.style.zoom || "1");
    document.body.style.zoom = Math.max(0.5, currentZoom - 0.1).toString();
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleHome = () => {
    navigate("/dashboard");
  };

  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      className="h-16 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 gap-3"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Left: Back / Forward arrows + Date */}
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
          title={lang === "ar" ? "رجوع" : "Go back"}
        >
          {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(1)}
          title={lang === "ar" ? "للأمام" : "Go forward"}
        >
          {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
        <span className="text-sm text-muted-foreground hidden lg:block ms-3">{today}</span>
      </div>

      {/* Right: Tools + Lang toggle + bell + profile */}
      <div className="flex items-center gap-2">
        {/* New utility icons */}
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleZoomOut} title="Zoom Out">
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

        <Button variant="ghost" size="icon" className="relative text-muted-foreground h-8 w-8" title="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </Button>

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
