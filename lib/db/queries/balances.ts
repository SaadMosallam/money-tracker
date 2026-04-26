import { desc, eq, sql } from "drizzle-orm";
import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { db } from "@/lib/db/index";
import {
  expenseParticipants,
  expenses,
  payments,
  users,
  expenseApprovals,
  paymentApprovals,
} from "@/lib/db/schema";
import type { CalculateBalancesInput } from "@/lib/types/expensesTypes";

export const getUserIds = async () => {
  const usersRows = await db.select().from(users);
  return usersRows.map((user) => user.id);
};

export const getApprovedExpenses = async (limit?: number, offset = 0) => {
  const query = db
    .select({ expense: expenses })
    .from(expenses)
    .innerJoin(expenseApprovals, eq(expenses.id, expenseApprovals.expenseId))
    .groupBy(expenses.id)
    .having(sql`bool_and(${expenseApprovals.status} = 'approved')`)
    .orderBy(desc(expenses.createdAt));
  if (typeof limit === "number") {
    return query.limit(limit).offset(offset);
  }
  return query;
};

export const getApprovedExpenseParticipants = async () => {
  return db
    .select({ participant: expenseParticipants })
    .from(expenseParticipants).where(sql`
      ${expenseParticipants.expenseId} IN (
        SELECT ${expenseApprovals.expenseId}
        FROM ${expenseApprovals}
        GROUP BY ${expenseApprovals.expenseId}
        HAVING bool_and(${expenseApprovals.status} = 'approved')
      )
    `);
};

export const getApprovedPayments = async () => {
  const query = db
    .select({
      payment: payments,
    })
    .from(payments)
    .innerJoin(paymentApprovals, eq(payments.id, paymentApprovals.paymentId))
    .groupBy(payments.id)
    .having(sql`bool_and(${paymentApprovals.status} = 'approved')`)
    .orderBy(desc(payments.createdAt));

  return query;
};

export const getBalanceDataset = async (): Promise<CalculateBalancesInput> => {
  const [userIds, approvedExpenses, approvedParticipants, approvedPayments] =
    await Promise.all([
      getUserIds(),
      getApprovedExpenses(),
      getApprovedExpenseParticipants(),
      getApprovedPayments(),
    ]);

  return {
    userIds,
    expenses: approvedExpenses.map(({ expense }) => expense),
    participants: approvedParticipants.map(({ participant }) => participant),
    payments: approvedPayments.map(({ payment }) => payment),
  };
};

export const getBalances = async () => {
  const dataset = await getBalanceDataset();
  return calculateBalances(dataset);
};
