export type ExpenseRow = {
    id: string;
    amount: number; // cents
    paidById: string;
    isSettled: boolean;
};

export type ExpenseParticipantRow = {
    expenseId: string;
    userId: string;
    weight: number;
};

export type PaymentRow = {
    fromUserId: string;
    toUserId: string;
    amount: number; // cents
}

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };


export type BalanceByUserId = Record<string, number>; // userId -> balance in cents (negative means the user owes money, positive means the user is owed money)

export type CalculateBalancesInput = {
    userIds: string[];
    expenses: ExpenseRow[];
    participants: ExpenseParticipantRow[];
    payments: PaymentRow[];
};