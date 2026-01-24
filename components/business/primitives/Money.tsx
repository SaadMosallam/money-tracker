type MoneyProps = {
  cents: number;
};

export function Money({ cents }: MoneyProps) {
  const value = (cents / 100).toFixed(2);

  return (
    <span className="font-mono tabular-nums">
      {value} <span className="text-xs text-muted-foreground">EGP</span>
    </span>
  );
}
