import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { ExpenseForm } from "@/components/business/expense/ExpenseForm";
import { createExpense } from "@/lib/actions/createExpense";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary, Locale } from "@/lib/i18n";

type NewExpensePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function NewExpensePage({ params }: NewExpensePageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const [users, session] = await Promise.all([
    getUsers(),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id ?? "";
  const currentUserName = session?.user?.name ?? "";

  return (
    <PageContainer title={t.newExpense}>
      <ExpenseForm
        users={users}
        action={createExpense}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        locale={locale}
        t={t}
      />
    </PageContainer>
  );
}
