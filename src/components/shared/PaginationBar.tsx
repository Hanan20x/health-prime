import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationBar({ page, totalPages, onPrev, onNext }: PaginationBarProps) {
  const { lang, isArabic } = useLang();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-xs text-muted-foreground">
        {tx("page", lang)} {page} {tx("of", lang)} {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onPrev}
          disabled={page <= 1}
        >
          {isArabic ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          {tx("previous", lang)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          {tx("next", lang)}
          {isArabic ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
