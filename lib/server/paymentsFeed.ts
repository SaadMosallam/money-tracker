import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPaymentApprovalsByPaymentIds } from "@/lib/db/queries/approvals";
import { getPayments } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";
import { computeApprovalStatus } from "@/lib/utils/approvalStatus";
import { buildUserNameById } from "@/lib/utils/userNameById";

export const PAYMENTS_PAGE_SIZE = 20;

export type PaymentFeedRow = {
  id: string;
  fromName: string;
  toName: string;
  amount: number;
  createdAt: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  canApprove: boolean;
  isSettled: boolean;
};

export const getPaymentFeedChunk = async ({
  offset,
  limit = PAYMENTS_PAGE_SIZE,
}: {
  offset: number;
  limit?: number;
}) => {
  const queryLimit = limit + 1;
  const [paymentsRaw, users, session] = await Promise.all([
    getPayments(queryLimit, offset),
    getUsers(),
    getServerSession(authOptions),
  ]);

  const hasMore = paymentsRaw.length > limit;
  const payments = paymentsRaw.slice(0, limit);
  const paymentIds = payments.map((payment) => payment.id);

  const approvals = await getPaymentApprovalsByPaymentIds(paymentIds);
  const currentUserId = session?.user?.id ?? "";
  const userNameById = buildUserNameById(users);
  const approvalsByPayment = new Map<string, typeof approvals>();
  for (const approval of approvals) {
    const list = approvalsByPayment.get(approval.paymentId) ?? [];
    list.push(approval);
    approvalsByPayment.set(approval.paymentId, list);
  }

  const rows: PaymentFeedRow[] = payments.map((payment) => {
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
      createdAt: payment.createdAt ? payment.createdAt.toISOString() : null,
      approvalStatus,
      canApprove: userApproval?.status === "pending",
      isSettled: payment.isSettled,
    };
  });

  return { rows, hasMore };
};
