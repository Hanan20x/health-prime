import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <div className={cn("bg-card border border-border/50 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow ring-1 ring-border/5 flex items-start gap-4", className)}>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-primary tracking-tight leading-none">{value}</p>
        {description && <p className="text-[10px] text-muted-foreground/70 mt-2 font-medium italic">{description}</p>}
      </div>
    </div>
  );
}
