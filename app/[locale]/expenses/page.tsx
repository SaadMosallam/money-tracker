import { getExpenses, getExpenseParticipants } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";
import { ExpenseList } from "@/components/business/expense/ExpenseList";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { buildUserNameById } from "@/lib/utils/userNameById";
import { getDictionary, Locale } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getExpenseApprovalsByExpenseIds } from "@/lib/db/queries/approvals";
import { computeApprovalStatus } from "@/lib/utils/approvalStatus";

type ExpensesPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const [expenses, participants, users, session] = await Promise.all([
    getExpenses(),
    getExpenseParticipants(),
    getUsers(),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id ?? "";

  const approvals = await getExpenseApprovalsByExpenseIds(
    expenses.map((expense) => expense.id)
  );
  const approvalsByExpense = new Map<string, typeof approvals>();
  for (const approval of approvals) {
    const list = approvalsByExpense.get(approval.expenseId) ?? [];
    list.push(approval);
    approvalsByExpense.set(approval.expenseId, list);
  }

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
    const participants = list.map((p) => {
      const name = userNameById[p.userId] ?? p.userId;
      const percent =
        totalWeight > 0 ? (p.weight / totalWeight) * 100 : 0;
      const percentLabel =
        percent > 0 && percent < 0.01
          ? "<0.01%"
          : `${percentFormatter.format(percent)}%`;
      const label = hasEqualShares ? name : `${name} (${percentLabel})`;
      const avatarUrl = users.find((u) => u.id === p.userId)?.avatarUrl ?? null;
      return { name, imageUrl: avatarUrl, label };
    });

    const approvalList = approvalsByExpense.get(expense.id) ?? [];
    const approvalStatus = computeApprovalStatus(approvalList);
    const userApproval = approvalList.find(
      (approval) => approval.userId === currentUserId
    );

    return {
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      paidByName: userNameById[expense.paidById] ?? expense.paidById,
      participants,
      isSettled: expense.isSettled,
      createdAt: expense.createdAt ?? null,
      approvalStatus,
      canApprove: userApproval?.status === "pending",
    };
  });

  const unsettledRows = rows.filter((row) => !row.isSettled);
  const settledRows = rows.filter((row) => row.isSettled);

  return (
    <PageContainer title={t.expenses} maxWidthClassName="max-w-6xl">
      <div className="space-y-6">
        <ExpenseList
          rows={unsettledRows}
          title={t.unsettledExpenses}
          emptyMessage={t.noUnsettledExpenses}
          t={t}
          locale={locale}
        />

        <details className="rounded-xl border bg-card text-card-foreground shadow">
          <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold">
            {t.settledExpenses} ({settledRows.length})
          </summary>
          <div className="px-6 pb-6">
            {settledRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t.noSettledExpenses}
              </div>
            ) : (
              <ExpenseList
                rows={settledRows}
                title={t.settledExpenses}
                emptyMessage={t.noSettledExpenses}
                variant="plain"
                showTitle={false}
                t={t}
                locale={locale}
              />
            )}
          </div>
        </details>
      </div>
    </PageContainer>
  );
}
