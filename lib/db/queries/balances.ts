import { calculateBalances } from "@/lib/calculations/calculateBalances";
import { db } from "@/lib/db/index";
import { expenseParticipants, expenses, payments, users } from "@/lib/db/schema";

export const getUserIds = async () => {
  const userIds = await db.select().from(users);
  return userIds.map((user) => user.id);
};

export const getExpenses = async () => {
    return db.select().from(expenses);
};

export const getExpenseParticipants = async () => {
    return db.select().from(expenseParticipants);
};

export const getPayments = async () => {
    return db.select().from(payments);
};

export const getBalanceDataset = async () => {
    const [
      userIds,
      expenses,
      participants,
      payments,
    ] = await Promise.all([
      getUserIds(),
      getExpenses(),
      getExpenseParticipants(),
      getPayments(),
    ]);
  
    return {
      userIds,
      expenses,
      participants,
      payments,
    };
};

export const getBalances = async () => {
    const dataset = await getBalanceDataset();
    return calculateBalances(dataset);
};