import { createPayment } from "@/lib/actions/createPayment";
import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { PaymentCreateForm } from "@/components/business/payment/PaymentCreateForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function NewPaymentPage() {
  const [users, session] = await Promise.all([
    getUsers(),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id ?? "";
  const currentUserName = session?.user?.name ?? "";

  return (
    <PageContainer title="Create Payment">
      <PaymentCreateForm
        users={users}
        action={createPayment}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </PageContainer>
  );
}
