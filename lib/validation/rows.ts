    import type { ExpenseRow, ExpenseParticipantRow, PaymentRow, ValidationResult } from "@/lib/types/expensesTypes";


const ok = (): ValidationResult => ({ ok: true });
const fail = (...errors: string[]): ValidationResult => ({ ok: false, errors });

export function validateExpenseRows(expenses: ExpenseRow[]): ValidationResult {
  const errors: string[] = [];

  for (const expense of expenses) {
    if (!expense.id) errors.push("Expense.id is required");
    if (!expense.paidById) errors.push("Expense.paidById is required");

    // amount must be positive integer cents
    if (!Number.isInteger(expense.amount)) errors.push("Expense.amount must be an integer (cents)");
    if (expense.amount <= 0) errors.push("Expense.amount must be > 0");

    // isSettled can be true/false; both are valid (do NOT treat as invalid)
    if (typeof expense.isSettled !== "boolean") errors.push("Expense.isSettled must be boolean");
  }
  return errors.length ? fail(...errors) : ok();
}

export function validateExpenseParticipantRows(
  rows: ExpenseParticipantRow[]
): ValidationResult {
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.expenseId) errors.push("Participant.expenseId is required");
    if (!row.userId) errors.push("Participant.userId is required");

    if (!Number.isInteger(row.weight)) errors.push("Participant.weight must be an integer");
    if (row.weight < 1) errors.push("Participant.weight must be >= 1");
  }
  return errors.length ? fail(...errors) : ok();
}

export function validatePaymentRows(payments: PaymentRow[]): ValidationResult {
  const errors: string[] = [];

  for (const payment of payments) {
    if (!payment.fromUserId) errors.push("Payment.fromUserId is required");
    if (!payment.toUserId) errors.push("Payment.toUserId is required");

    if (payment.fromUserId && payment.toUserId && payment.fromUserId === payment.toUserId) {
      errors.push("Payment.fromUserId and toUserId must be different");
    }

    if (!Number.isInteger(payment.amount)) errors.push("Payment.amount must be an integer (cents)");
    if (payment.amount <= 0) errors.push("Payment.amount must be > 0");
  }
  return errors.length ? fail(...errors) : ok();
}
