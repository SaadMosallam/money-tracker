import { getExpenses, getExpenseParticipants } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";
import { ExpenseList } from "@/components/business/expense/ExpenseList";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { buildUserNameById } from "@/lib/ui/utils/userNameById";

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
    const participantsLabel =
      list.length === 0
        ? "—"
        : list
            .map((p) => {
              const name = userNameById[p.userId] ?? p.userId;
              return p.weight === 1 ? name : `${name} (${p.weight})`;
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
    <PageContainer title="Expenses">
      <ExpenseList rows={rows} />
    </PageContainer>
  );
}
