import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { ExpenseForm } from "@/components/business/expense/ExpenseForm";
import { createExpense } from "@/lib/actions/createExpense";

export default async function NewExpensePage() {
  const users = await getUsers();

  return (
    <PageContainer title="Create Expense">
      <ExpenseForm users={users} action={createExpense} />
    </PageContainer>
  );
}
