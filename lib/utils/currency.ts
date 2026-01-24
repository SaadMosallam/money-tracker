export const parseCurrencyToCents = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, "");
  const match = normalized.match(/^(\d+)(?:\.(\d{0,2}))?$/);
  if (!match) return null;

  const whole = Number(match[1]);
  const fraction = match[2] ? match[2].padEnd(2, "0") : "00";
  const cents = whole * 100 + Number(fraction);
  return Number.isFinite(cents) ? cents : null;
};

export const sanitizeCurrencyInput = (value: string) => {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const dotIndex = sanitized.indexOf(".");
  if (dotIndex === -1) {
    return sanitized;
  }

  const whole = sanitized.slice(0, dotIndex);
  const remainder = sanitized.slice(dotIndex + 1);
  const fraction = remainder.replace(/\./g, "");
  const clampedFraction = fraction.slice(0, 2);
  const hasTrailingDot = remainder.length === 0;

  if (hasTrailingDot && clampedFraction.length === 0) {
    return `${whole}.`;
  }

  return `${whole}.${clampedFraction}`;
};
