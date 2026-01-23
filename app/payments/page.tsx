import { getPayments } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/lib/ui/components/layout/PageContainer";
import { PaymentList } from "@/lib/ui/components/payment/PaymentForm";
import { buildUserNameById } from "@/lib/ui/utils/userNameById";

export default async function PaymentsPage() {
  const [payments, users] = await Promise.all([getPayments(), getUsers()]);
  const userNameById = buildUserNameById(users);

  const rows = payments.map((payment) => ({
    id: payment.id,
    fromName: userNameById[payment.fromUserId] ?? payment.fromUserId,
    toName: userNameById[payment.toUserId] ?? payment.toUserId,
    amount: payment.amount,
    createdAt: payment.createdAt ?? null,
  }));

  return (
    <PageContainer title="Payments">
      <PaymentList rows={rows} />
    </PageContainer>
  );
}
