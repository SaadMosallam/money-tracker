import { validateBalanceDataset } from "@/lib/validation/validateBalanceDataset";
import { BalanceByUserId, CalculateBalancesInput } from "@/lib/types/expensesTypes";
import { validateExpenseParticipantRows, validateExpenseRows, validatePaymentRows } from "@/lib/validation/rows";
import { splitAmountByWeights } from "@/lib/calculations/splitAmountByWeights";

export function calculateBalances(input: CalculateBalancesInput) {
  const { userIds, expenses, participants, payments } = input;
  // Step 1: row-level validation (already done elsewhere)
  const expenseValidation = validateExpenseRows(expenses);
  if (!expenseValidation.ok) {
    throw new Error(expenseValidation.errors.join(", "));
  }
  const participantValidation = validateExpenseParticipantRows(participants);
  if (!participantValidation.ok) {
    throw new Error(participantValidation.errors.join(", "));
  }
  const paymentValidation = validatePaymentRows(payments);
  if (!paymentValidation.ok) {
    throw new Error(paymentValidation.errors.join(", "));
  }
  // Step 2: aggregate validation
  validateBalanceDataset(input);


  // Step 3: initialize balances
  const balances: BalanceByUserId = {};
  for (const userId of userIds) {
    balances[userId] = 0;
  }

  const ensureBalance = (userId: string) => {
    if (balances[userId] === undefined) {
      balances[userId] = 0;
    }
  };

  // Step 4: apply unsettled expenses
  for (const expense of expenses) {
    if (expense.isSettled) continue;
  
    const expenseParticipants = participants.filter(
      (p) => p.expenseId === expense.id
    );
  
    if (expenseParticipants.length === 0) continue; // defensive, though validated
  
    const shares = splitAmountByWeights(
      expense.amount,
      expenseParticipants
    );
  
    for (const userId in shares) {
      if (userId === expense.paidById) continue;
      ensureBalance(userId);
      ensureBalance(expense.paidById);
      balances[userId] -= shares[userId];
      balances[expense.paidById] += shares[userId];
    }
  }

  // Step 5: apply payments
  for (const payment of payments) {
    ensureBalance(payment.fromUserId);
    ensureBalance(payment.toUserId);
    balances[payment.fromUserId] += payment.amount;
    balances[payment.toUserId] -= payment.amount;
  }

  return balances;
}