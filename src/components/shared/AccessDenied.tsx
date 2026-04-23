import { ShieldAlert } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export function AccessDenied() {
  const { lang } = useLang();
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">{tx("accessDenied", lang)}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{tx("noPermission", lang)}</p>
      </div>
    </DashboardLayout>
  );
}
