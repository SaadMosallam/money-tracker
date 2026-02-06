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
    <span className={cn("font-mono tabular-nums", tone)}>
      {value} <span className="text-xs text-muted-foreground">EGP</span>
    </span>
  );
}
