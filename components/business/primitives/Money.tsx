import { cn } from "@/lib/utils/cn";

type MoneyProps = {
  cents: number;
  locale?: string;
};

export function Money({ cents, locale = "en" }: MoneyProps) {
  const localeTag = locale === "ar" ? "ar-EG" : "en-GB";
  const formatter = new Intl.NumberFormat(localeTag, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const value = formatter.format(cents / 100);
  const tone =
    cents > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : cents < 0
        ? "text-rose-600 dark:text-rose-400"
        : "text-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 font-mono tabular-nums whitespace-nowrap",
        tone
      )}
    >
      {value}
    </span>
  );
}
