import type {
    ExpenseRow,
    ExpenseParticipantRow,
    PaymentRow,
  } from "@/lib/types/expensesTypes";
  
  type ValidateBalanceDatasetInput = {
    expenses: ExpenseRow[];
    participants: ExpenseParticipantRow[];
    payments: PaymentRow[];
  };
  
  export function validateBalanceDataset({
    expenses,
    participants,
    payments,
  }: ValidateBalanceDatasetInput): void {
    // Index participants by expense
    const participantsByExpense = new Map<string, ExpenseParticipantRow[]>();
    const participantKeySet = new Set<string>();
  
    for (const p of participants) {
      const key = `${p.expenseId}:${p.userId}`;
      if (participantKeySet.has(key)) {
        throw new Error(
          `Duplicate participant for expense ${p.expenseId} and user ${p.userId}`
        );
      }
      participantKeySet.add(key);
  
      const list = participantsByExpense.get(p.expenseId) ?? [];
      list.push(p);
      participantsByExpense.set(p.expenseId, list);
    }
  
    // Validate each unsettled expense
    for (const expense of expenses) {
      if (expense.isSettled) continue;
  
      const list = participantsByExpense.get(expense.id);
      if (!list || list.length === 0) {
        throw new Error(
          `Unsettled expense ${expense.id} has no participants`
        );
      }
  
      const totalWeight = list.reduce((sum, p) => sum + p.weight, 0);
      if (totalWeight <= 0) {
        throw new Error(
          `Expense ${expense.id} has invalid total participant weight`
        );
      }
    }
  
    // Optional sanity check for payments
    for (const payment of payments) {
      if (payment.fromUserId === payment.toUserId) {
        throw new Error(
          `Payment fromUserId and toUserId must be different`
        );
      }
    }
  }
  