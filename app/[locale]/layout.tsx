import type { ReactNode } from "react";
import { Locale, rtlLocales } from "@/lib/i18n";

type LocaleLayoutProps = {
  children: ReactNode;
  params: { locale: Locale };
};

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const dir = rtlLocales.includes(params.locale) ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={params.locale} className="min-h-screen">
      {children}
    </div>
  );
}
