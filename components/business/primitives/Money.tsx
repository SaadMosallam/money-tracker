import { cn } from "@/lib/utils/cn";

type MoneyProps = {
  cents: number;
};

export function Money({ cents }: MoneyProps) {
  const value = (cents / 100).toFixed(2);
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
