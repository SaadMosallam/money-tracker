import { getExpenses, getExpenseParticipants } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";
import { ExpenseList } from "@/components/business/expense/ExpenseList";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { buildUserNameById } from "@/lib/utils/userNameById";

export default async function ExpensesPage() {
  const [expenses, participants, users] = await Promise.all([
    getExpenses(),
    getExpenseParticipants(),
    getUsers(),
  ]);

  const userNameById = buildUserNameById(users);

  const participantsByExpense = new Map<string, typeof participants>();
  for (const participant of participants) {
    const list = participantsByExpense.get(participant.expenseId) ?? [];
    list.push(participant);
    participantsByExpense.set(participant.expenseId, list);
  }

  const rows = expenses.map((expense) => {
    const list = participantsByExpense.get(expense.id) ?? [];
    const totalWeight = list.reduce((sum, p) => sum + p.weight, 0);
    const hasEqualShares =
      list.length > 0 && list.every((p) => p.weight === list[0].weight);
    const percentFormatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    const participantsLabel =
      list.length === 0
        ? "—"
        : hasEqualShares
        ? list
            .map((p) => userNameById[p.userId] ?? p.userId)
            .join(", ")
        : list
          .map((p) => {
            const name = userNameById[p.userId] ?? p.userId;
            const percent =
              totalWeight > 0 ? (p.weight / totalWeight) * 100 : 0;
            const percentLabel =
              percent > 0 && percent < 0.01
                ? "<0.01%"
                : `${percentFormatter.format(percent)}%`;
            return `${name} (${percentLabel})`;
          })
          .join(", ");

    return {
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      paidByName: userNameById[expense.paidById] ?? expense.paidById,
      participantsLabel,
      isSettled: expense.isSettled,
      createdAt: expense.createdAt ?? null,
    };
  });

  return (
    <PageContainer title="Expenses" maxWidthClassName="max-w-6xl">
      <ExpenseList rows={rows} />
    </PageContainer>
  );
}
