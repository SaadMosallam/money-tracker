import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { ExpenseForm } from "@/components/business/expense/ExpenseForm";
import { createExpense } from "@/lib/actions/createExpense";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function NewExpensePage() {
  const [users, session] = await Promise.all([
    getUsers(),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id ?? "";
  const currentUserName = session?.user?.name ?? "";

  return (
    <PageContainer title="Create Expense">
      <ExpenseForm
        users={users}
        action={createExpense}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </PageContainer>
  );
}
