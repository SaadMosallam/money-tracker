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
      isSettled: payment.isSettled,
    };
  });

  const unsettledRows = rows.filter((row) => !row.isSettled);
  const settledRows = rows.filter((row) => row.isSettled);

  return (
    <PageContainer title={t.payments}>
      <div className="space-y-6">
        <PaymentList
          rows={unsettledRows}
          t={t}
          locale={locale}
          title={t.unsettledPayments}
          emptyMessage={t.noUnsettledPayments}
        />

        <details className="rounded-xl border bg-card text-card-foreground shadow">
          <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold">
            {t.settledPayments} ({settledRows.length})
          </summary>
          <div className="px-6 pb-6">
            {settledRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t.noSettledPayments}
              </div>
            ) : (
              <PaymentList
                rows={settledRows}
                t={t}
                locale={locale}
                title={t.settledPayments}
                emptyMessage={t.noSettledPayments}
                variant="plain"
                showTitle={false}
              />
            )}
          </div>
        </details>
      </div>
    </PageContainer>
  );
}
