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

  const unsettledRows = rows.filter((row) => !row.isSettled);
  const settledRows = rows.filter((row) => row.isSettled);

  return (
    <PageContainer title="Expenses" maxWidthClassName="max-w-6xl">
      <div className="space-y-6">
        <ExpenseList
          rows={unsettledRows}
          title="Unsettled Expenses"
          emptyMessage="No unsettled expenses."
        />

        <details className="rounded-xl border bg-card text-card-foreground shadow">
          <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold">
            Settled Expenses ({settledRows.length})
          </summary>
          <div className="px-6 pb-6">
            {settledRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No settled expenses yet.
              </div>
            ) : (
              <ExpenseList
                rows={settledRows}
                title="Settled Expenses"
                emptyMessage="No settled expenses yet."
                variant="plain"
                showTitle={false}
              />
            )}
          </div>
        </details>
      </div>
    </PageContainer>
  );
}
