"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Languages } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Dictionary } from "@/lib/i18n";

type AccountTabsBarProps = {
  locale: string;
  activeTab: "profile" | "approvals";
  approvalCount: number;
  switchLocaleHref: string;
  switchLocaleLabel: string;
  t: Dictionary;
};

export function AccountTabsBar({
  locale,
  activeTab,
  approvalCount,
  switchLocaleHref,
  switchLocaleLabel,
  t,
}: AccountTabsBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative">
      <div className="flex items-center gap-3 overflow-x-auto py-1 pr-6 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href={`/${locale}/account`}
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "profile"
              ? "bg-foreground text-background"
              : "bg-muted text-foreground hover:bg-muted/80"
          )}
        >
          {t.profile}
        </Link>
        <Link
          href={`/${locale}/account?tab=approvals`}
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "approvals"
              ? "bg-foreground text-background"
              : "bg-muted text-foreground hover:bg-muted/80"
          )}
        >
          <span className="flex items-center gap-2">
            {t.approvals}
            {approvalCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-white">
                {approvalCount}
              </span>
            )}
          </span>
        </Link>

        <a
          href={switchLocaleHref}
          aria-label={switchLocaleLabel}
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Languages className="h-4 w-4" />
          {switchLocaleLabel}
        </a>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {t.theme ?? "Theme"}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
