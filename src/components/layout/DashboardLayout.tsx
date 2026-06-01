import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { apiFetch } from "@/api/client";
import type { UserOut } from "@/api/types";
import { useLang } from "@/hooks/useLang";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { lang } = useLang();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { data: me } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<UserOut>("/auth/me"),
  });

  return (
    <div className="flex min-h-screen w-full" dir={lang === "ar" ? "rtl" : "ltr"}>
      {isSidebarOpen && <AppSidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader 
          userName={me?.fullName} 
          userRole={me?.role} 
          avatarUrl={me?.avatarUrl} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
