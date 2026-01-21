import type { ExpenseParticipantRow } from "@/lib/types/expensesTypes";

/**
 * Splits an integer amount (cents) across participants by weight.
 * Guarantees:
 * - integer results
 * - sum(shares) === totalAmount
 * - deterministic remainder distribution
 */
export function splitAmountByWeights(
  totalAmount: number,
  participants: ExpenseParticipantRow[]
): Record<string, number> {
  if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
    throw new Error("totalAmount must be a positive integer (cents)");
  }
  if (participants.length === 0) {
    throw new Error("participants must be non-empty");
  }

  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("totalWeight must be > 0");
  }

  // First pass: compute base shares and fractional remainders
  type Calc = {
    userId: string;
    base: number;     // integer cents
    remainder: number; // remainder numerator for ordering
  };

  const calcs: Calc[] = participants.map((p) => {
    const numerator = totalAmount * p.weight; // integer
    const base = Math.floor(numerator / totalWeight);
    const remainder = numerator % totalWeight;
    return { userId: p.userId, base, remainder };
  });

  const baseSum = calcs.reduce((sum, c) => sum + c.base, 0);
  let remainingCents = totalAmount - baseSum;

  // Deterministic order:
  // 1) higher remainder first
  // 2) tie-break by userId (stable across runs)
  calcs.sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.userId.localeCompare(b.userId);
  });

  // Distribute remaining cents
  for (let i = 0; i < calcs.length && remainingCents > 0; i++) {
    calcs[i].base += 1;
    remainingCents -= 1;
  }

  // Build result map
  const result: Record<string, number> = {};
  for (const c of calcs) {
    result[c.userId] = c.base;
  }

  // Final sanity check
  const finalSum = Object.values(result).reduce((s, v) => s + v, 0);
  if (finalSum !== totalAmount) {
    throw new Error(
      `Split error: expected ${totalAmount}, got ${finalSum}`
    );
  }

  return result;
}
