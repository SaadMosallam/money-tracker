import { calculateBalances } from "@/lib/calculations/calculateBalances";

type AssertionError = {
  message: string;
  expected?: unknown;
  actual?: unknown;
};

const assertEqual = (actual: unknown, expected: unknown, message: string) => {
  if (actual !== expected) {
    const error: AssertionError = { message, expected, actual };
    throw new Error(JSON.stringify(error));
  }
};

const assertDeepEqual = (
  actual: Record<string, number>,
  expected: Record<string, number>,
  message: string
) => {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((k, i) => k !== expectedKeys[i])
  ) {
    const error: AssertionError = { message, expected, actual };
    throw new Error(JSON.stringify(error));
  }
  for (const key of expectedKeys) {
    assertEqual(actual[key], expected[key], `${message} (key: ${key})`);
  }
};

const run = () => {
  // Test 1: equal split between payer + participant
  const result1 = calculateBalances({
    userIds: ["a", "b"],
    expenses: [{ id: "e1", amount: 1000, paidById: "a", isSettled: false }],
    participants: [
      { expenseId: "e1", userId: "a", weight: 1 },
      { expenseId: "e1", userId: "b", weight: 1 },
    ],
    payments: [],
  });
  assertDeepEqual(
    result1,
    { a: 500, b: -500 },
    "equal split should create correct balances"
  );

  // Test 2: payer not participant
  const result2 = calculateBalances({
    userIds: ["a", "b", "c"],
    expenses: [{ id: "e2", amount: 900, paidById: "a", isSettled: false }],
    participants: [
      { expenseId: "e2", userId: "b", weight: 1 },
      { expenseId: "e2", userId: "c", weight: 1 },
    ],
    payments: [],
  });
  assertDeepEqual(
    result2,
    { a: 900, b: -450, c: -450 },
    "payer not participant should still receive full amount"
  );

  // Test 3: weighted split with deterministic remainder
  const result3 = calculateBalances({
    userIds: ["a", "b"],
    expenses: [{ id: "e3", amount: 1001, paidById: "a", isSettled: false }],
    participants: [
      { expenseId: "e3", userId: "a", weight: 1 },
      { expenseId: "e3", userId: "b", weight: 2 },
    ],
    payments: [],
  });
  assertDeepEqual(
    result3,
    { a: 667, b: -667 },
    "weighted split should be deterministic and integer-safe"
  );

  // Test 4: payments reduce debt globally
  const result4 = calculateBalances({
    userIds: ["a", "b"],
    expenses: [{ id: "e4", amount: 1000, paidById: "a", isSettled: false }],
    participants: [
      { expenseId: "e4", userId: "a", weight: 1 },
      { expenseId: "e4", userId: "b", weight: 1 },
    ],
    payments: [{ fromUserId: "b", toUserId: "a", amount: 200 }],
  });
  assertDeepEqual(
    result4,
    { a: 300, b: -300 },
    "payment should reduce debt independently of expenses"
  );

  console.log("calculateBalances tests passed");
};

run();
