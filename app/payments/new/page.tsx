import { createPayment } from "@/lib/actions/createPayment";
import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { PaymentCreateForm } from "@/components/business/payment/PaymentCreateForm";

export default async function NewPaymentPage() {
  const users = await getUsers();

  return (
    <PageContainer title="Create Payment">
      <PaymentCreateForm users={users} action={createPayment} />
    </PageContainer>
  );
}
