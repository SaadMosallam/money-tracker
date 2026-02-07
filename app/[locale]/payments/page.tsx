import { getPayments } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { PaymentList } from "@/components/business/payment/PaymentForm";
import { buildUserNameById } from "@/lib/utils/userNameById";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPaymentApprovalsByPaymentIds } from "@/lib/db/queries/approvals";
import { computeApprovalStatus } from "@/lib/utils/approvalStatus";
import { getDictionary, Locale } from "@/lib/i18n";

type PaymentsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const [payments, users, session] = await Promise.all([
    getPayments(),
    getUsers(),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id ?? "";
  const userNameById = buildUserNameById(users);

  const approvals = await getPaymentApprovalsByPaymentIds(
    payments.map((payment) => payment.id)
  );
  const approvalsByPayment = new Map<string, typeof approvals>();
  for (const approval of approvals) {
    const list = approvalsByPayment.get(approval.paymentId) ?? [];
    list.push(approval);
    approvalsByPayment.set(approval.paymentId, list);
  }

  const rows = payments.map((payment) => {
    const approvalList = approvalsByPayment.get(payment.id) ?? [];
    const approvalStatus = computeApprovalStatus(approvalList);
    const userApproval = approvalList.find(
      (approval) => approval.userId === currentUserId
    );

    return {
      id: payment.id,
      fromName: userNameById[payment.fromUserId] ?? payment.fromUserId,
      toName: userNameById[payment.toUserId] ?? payment.toUserId,
      amount: payment.amount,
      createdAt: payment.createdAt ?? null,
      approvalStatus,
      canApprove: userApproval?.status === "pending",
    };
  });

  return (
    <PageContainer title={t.payments}>
      <PaymentList rows={rows} t={t} />
    </PageContainer>
  );
}
