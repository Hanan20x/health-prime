import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserRound,
  ClipboardList,
  HeartPulse,
  LogOut,
  Activity,
  CalendarPlus,
  CalendarDays,
  Brain,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx } from "@/lib/i18n";
import { setToken } from "@/api/client";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLang();
  const { isAdmin, canManageProviders, canRecordVitals, canViewEMR } = useAuth();

  const navItems = [
    { key: "dashboard" as const, path: "/dashboard", icon: LayoutDashboard, always: true },
    { key: "appointments" as const, path: "/appointments", icon: CalendarPlus, always: true },
    { key: "healthcareProviders" as const, path: "/providers", icon: Users, always: canManageProviders },
    { key: "patients" as const, path: "/patients", icon: UserRound, always: true },
    { key: "patientEMR" as const, path: "/patients/emr", icon: ClipboardList, always: canViewEMR },
    { key: "recordVitals" as const, path: "/vitals/record", icon: Activity, always: canRecordVitals },
    { key: "howAiWorks" as const, path: "/ai-agents-explained", icon: Brain, always: true },
    { key: "aboutClinic" as const, path: "/about", icon: Info, always: true },
  ].filter((item) => item.always);

  const handleLogout = () => {
    setToken(null);
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className="flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground shrink-0"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-primary tracking-tight">
          {tx("appTitle", lang)}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/patients" && location.pathname.startsWith(item.path)) ||
            (item.path === "/patients" && location.pathname === "/patients");
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{tx(item.key, lang)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>{tx("logout", lang)}</span>
        </button>
      </div>
    </aside>
  );
}
