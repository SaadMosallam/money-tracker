import { createPayment } from "@/lib/actions/createPayment";
import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/lib/ui/components/layout/PageContainer";
import { PaymentCreateForm } from "@/lib/ui/components/payment/PaymentCreateForm";

export default async function NewPaymentPage() {
  const users = await getUsers();

  return (
    <PageContainer title="Create Payment">
      <PaymentCreateForm users={users} action={createPayment} />
    </PageContainer>
  );
}
