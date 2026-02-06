import { desc } from "drizzle-orm";
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
import { computeApprovalStatus } from "@/lib/utils/approvalStatus";

export const getUserIds = async () => {
  const usersRows = await db.select().from(users);
  return usersRows.map((user) => user.id);
};

export const getExpenses = async () => {
  return db.select().from(expenses).orderBy(desc(expenses.createdAt));
};

export const getExpenseParticipants = async () => {
    return db.select().from(expenseParticipants);
};

export const getPayments = async () => {
  return db.select().from(payments).orderBy(desc(payments.createdAt));
};

export const getBalanceDataset = async () => {
    const [
      userIds,
      expenses,
      participants,
      payments,
      expenseApprovalsRows,
      paymentApprovalsRows,
    ] = await Promise.all([
      getUserIds(),
      getExpenses(),
      getExpenseParticipants(),
      getPayments(),
      db.select().from(expenseApprovals),
      db.select().from(paymentApprovals),
    ]);
  
    const approvalsByExpense = new Map<string, typeof expenseApprovalsRows>();
    for (const approval of expenseApprovalsRows) {
      const list = approvalsByExpense.get(approval.expenseId) ?? [];
      list.push(approval);
      approvalsByExpense.set(approval.expenseId, list);
    }

    const approvalsByPayment = new Map<string, typeof paymentApprovalsRows>();
    for (const approval of paymentApprovalsRows) {
      const list = approvalsByPayment.get(approval.paymentId) ?? [];
      list.push(approval);
      approvalsByPayment.set(approval.paymentId, list);
    }

    const approvedExpenseIds = new Set(
      expenses
        .filter((expense) => {
          const approvals = approvalsByExpense.get(expense.id) ?? [];
          return computeApprovalStatus(approvals) === "approved";
        })
        .map((expense) => expense.id)
    );

    const approvedPaymentIds = new Set(
      payments
        .filter((payment) => {
          const approvals = approvalsByPayment.get(payment.id) ?? [];
          return computeApprovalStatus(approvals) === "approved";
        })
        .map((payment) => payment.id)
    );

    const approvedExpenses = expenses.filter((expense) =>
      approvedExpenseIds.has(expense.id)
    );
    const approvedParticipants = participants.filter((participant) =>
      approvedExpenseIds.has(participant.expenseId)
    );
    const approvedPayments = payments.filter((payment) =>
      approvedPaymentIds.has(payment.id)
    );

    return {
      userIds,
      expenses: approvedExpenses,
      participants: approvedParticipants,
      payments: approvedPayments,
    };
};

export const getBalances = async () => {
    const dataset = await getBalanceDataset();
    return calculateBalances(dataset);
};
