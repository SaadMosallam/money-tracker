import { splitAmountByWeights } from "@/lib/calculations/splitAmountByWeights";
import type { BalanceByUserId } from "@/lib/types/expensesTypes";

/**
 * One settled chocolate bar, reduced to what the balance math needs.
 * `area` and the values in `eatenByUser` are integers in the same unit
 * (width * height, where dimensions are stored as hundredths → unit = 1/10000).
 */
export type ChocolateBarForBalance = {
  id: string;
  cost: number; // cents, > 0
  area: number; // integer units, > 0
  buyerId: string;
  participantIds: string[];
  eatenByUser: Record<string, number>; // userId -> total eaten area (units)
};

export type CalculateChocolateBalancesInput = {
  userIds: string[];
  bars: ChocolateBarForBalance[];
};

/**
 * Splits each settled bar's cost so that every participant pays for the area
 * they personally ate, and the leftover (un-eaten) area is divided equally
 * among all participants (buyer included). Results accumulate across bars.
 *
 * For a bar with cost C, area A, N participants and eaten_i per user:
 *   leftover = A - Σ eaten_i        (clamped ≥ 0)
 *   weight_i = N·eaten_i + leftover
 *   share_i  = C · weight_i / Σweight = C·(eaten_i + leftover/N)/A
 *
 * Uses splitAmountByWeights for integer-safe, deterministic cent distribution.
 * Returns cents per user: positive = owed to the user, negative = the user owes.
 */
export function calculateChocolateBalances(
  input: CalculateChocolateBalancesInput,
): BalanceByUserId {
  const balances: BalanceByUserId = {};
  for (const userId of input.userIds) {
    balances[userId] = 0;
  }
  const ensureBalance = (userId: string) => {
    if (balances[userId] === undefined) balances[userId] = 0;
  };

  for (const bar of input.bars) {
    // Defensive: skip degenerate bars (splitAmountByWeights requires positives).
    if (bar.cost <= 0 || bar.area <= 0) continue;

    const participantIds = Array.from(new Set(bar.participantIds));
    if (participantIds.length === 0) continue;

    const n = participantIds.length;
    const eatenFor = (userId: string) =>
      Math.max(0, bar.eatenByUser[userId] ?? 0);

    const totalEaten = participantIds.reduce(
      (sum, userId) => sum + eatenFor(userId),
      0,
    );
    const leftover = Math.max(0, bar.area - totalEaten);

    const weights = participantIds.map((userId) => ({
      userId,
      weight: n * eatenFor(userId) + leftover,
    }));
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight <= 0) continue; // nothing to allocate

    const shares = splitAmountByWeights(bar.cost, weights);

    ensureBalance(bar.buyerId);
    balances[bar.buyerId] += bar.cost;
    for (const userId of participantIds) {
      ensureBalance(userId);
      balances[userId] -= shares[userId] ?? 0;
    }
  }

  return balances;
}
