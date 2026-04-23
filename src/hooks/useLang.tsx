import { createContext, useContext, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

interface LangCtx {
  lang: Lang;
  toggleLang: () => void;
  isArabic: boolean;
}

const LangContext = createContext<LangCtx>({
  lang: "en",
  toggleLang: () => {},
  isArabic: false,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const toggleLang = () =>
    setLang((l) => {
      const next = l === "en" ? "ar" : "en";
      // Apply RTL direction to document
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = next;
      return next;
    });

  return (
    <LangContext.Provider value={{ lang, toggleLang, isArabic: lang === "ar" }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
