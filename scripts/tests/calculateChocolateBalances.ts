import {
  calculateChocolateBalances,
  type CalculateChocolateBalancesInput,
} from "@/lib/calculations/calculateChocolateBalances";

let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

function eq(actual: number, expected: number, message: string) {
  assert(actual === expected, `${message} (expected ${expected}, got ${actual})`);
}

function sumValues(record: Record<string, number>) {
  return Object.values(record).reduce((s, v) => s + v, 0);
}

const A = "a";
const B = "b";
const C = "c";

// 1) Nobody eats → cost split equally among all participants (buyer included).
{
  console.log("nobody eats → equal split");
  const input: CalculateChocolateBalancesInput = {
    userIds: [A, B, C],
    bars: [
      { id: "1", cost: 1200, area: 100, buyerId: A, participantIds: [A, B, C], eatenByUser: {} },
    ],
  };
  const r = calculateChocolateBalances(input);
  eq(r[A], 800, "buyer A is owed 1200 - 400");
  eq(r[B], -400, "B owes 400");
  eq(r[C], -400, "C owes 400");
  eq(sumValues(r), 0, "balances sum to zero");
}

// 2) One eater + leftover.
{
  console.log("one eater + leftover");
  const input: CalculateChocolateBalancesInput = {
    userIds: [A, B, C],
    bars: [
      { id: "1", cost: 1200, area: 100, buyerId: A, participantIds: [A, B, C], eatenByUser: { a: 50 } },
    ],
  };
  const r = calculateChocolateBalances(input);
  // A: personal 50/100 = 600, + leftover (50 area → 600 cost) / 3 = 200 → 800 consumed
  eq(r[A], 400, "buyer A is owed 1200 - 800");
  eq(r[B], -200, "B owes leftover share 200");
  eq(r[C], -200, "C owes leftover share 200");
  eq(sumValues(r), 0, "balances sum to zero");
}

// 3) Full consumption, no leftover.
{
  console.log("full consumption, no leftover");
  const input: CalculateChocolateBalancesInput = {
    userIds: [A, B, C],
    bars: [
      { id: "1", cost: 1200, area: 100, buyerId: A, participantIds: [A, B, C], eatenByUser: { a: 60, b: 40 } },
    ],
  };
  const r = calculateChocolateBalances(input);
  eq(r[A], 480, "buyer A is owed 1200 - 720");
  eq(r[B], -480, "B owes 480 for 40% eaten");
  eq(r[C], 0, "C ate nothing, no leftover → owes 0");
  eq(sumValues(r), 0, "balances sum to zero");
}

// 4) Remainder distribution still conserves the total cost.
{
  console.log("remainder conservation");
  const input: CalculateChocolateBalancesInput = {
    userIds: [A, B, C],
    bars: [
      { id: "1", cost: 1000, area: 3, buyerId: A, participantIds: [A, B, C], eatenByUser: {} },
    ],
  };
  const r = calculateChocolateBalances(input);
  eq(sumValues(r), 0, "balances sum to zero");
  eq(r[A] + r[B] + r[C], 0, "no cents created or lost");
  // Two debtors pay 333 or 334, summing to what the buyer is owed.
  eq(-(r[B] + r[C]), r[A], "buyer credit equals debtors' total");
}

// 5) Multiple bars accumulate.
{
  console.log("multiple bars accumulate");
  const input: CalculateChocolateBalancesInput = {
    userIds: [A, B],
    bars: [
      { id: "1", cost: 1000, area: 100, buyerId: A, participantIds: [A, B], eatenByUser: {} }, // 500 each
      { id: "2", cost: 1000, area: 100, buyerId: B, participantIds: [A, B], eatenByUser: {} }, // 500 each
    ],
  };
  const r = calculateChocolateBalances(input);
  eq(r[A], 0, "A nets out across two symmetric bars");
  eq(r[B], 0, "B nets out across two symmetric bars");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll chocolate balance tests passed ✅");
