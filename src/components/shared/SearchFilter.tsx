import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ placeholder = "Search...", value, onChange }: SearchFilterProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 bg-card"
      />
    </div>
  );
}
