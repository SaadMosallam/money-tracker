import type { ReactNode } from "react";
import { rtlLocales } from "@/lib/i18n";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={locale} className="min-h-screen">
      {children}
    </div>
  );
}
