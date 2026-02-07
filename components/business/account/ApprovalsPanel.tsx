import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUsers } from "@/lib/db/queries/users";
import {
  getApprovalNotificationsByUser,
  getExpenseApprovalsByExpenseIds,
  getExpenseParticipantsByExpenseIds,
  getExpensesByIds,
  getPaymentApprovalsByPaymentIds,
  getPaymentsByIds,
} from "@/lib/db/queries/approvals";
import { buildUserNameById } from "@/lib/utils/userNameById";
import { computeApprovalStatus } from "@/lib/utils/approvalStatus";
import { Money } from "@/components/business/primitives/Money";
import { formatDateTime } from "@/lib/utils/date";
import {
  approveExpense,
  rejectExpense,
  approvePayment,
  rejectPayment,
} from "@/lib/actions/approvals";
import { Dictionary } from "@/lib/i18n";

type ApprovalsPanelProps = {
  userId: string;
  locale: string;
  t: Dictionary;
};

export default async function ApprovalsPanel({
  userId,
  locale,
  t,
}: ApprovalsPanelProps) {
  const [notifications, users] = await Promise.all([
    getApprovalNotificationsByUser(userId),
    getUsers(),
  ]);

  const expenseIds = Array.from(
    new Set(
      notifications
        .filter((n) => n.entityType === "expense")
        .map((n) => n.entityId)
    )
  );
  const paymentIds = Array.from(
    new Set(
      notifications
        .filter((n) => n.entityType === "payment")
        .map((n) => n.entityId)
    )
  );

  const [expenses, participants, expenseApprovals, payments, paymentApprovals] =
    await Promise.all([
      getExpensesByIds(expenseIds),
      getExpenseParticipantsByExpenseIds(expenseIds),
      getExpenseApprovalsByExpenseIds(expenseIds),
      getPaymentsByIds(paymentIds),
      getPaymentApprovalsByPaymentIds(paymentIds),
    ]);

  const userNameById = buildUserNameById(users);

  const participantsByExpense = new Map<string, typeof participants>();
  for (const participant of participants) {
    const list = participantsByExpense.get(participant.expenseId) ?? [];
    list.push(participant);
    participantsByExpense.set(participant.expenseId, list);
  }

  const approvalsByExpense = new Map<string, typeof expenseApprovals>();
  for (const approval of expenseApprovals) {
    const list = approvalsByExpense.get(approval.expenseId) ?? [];
    list.push(approval);
    approvalsByExpense.set(approval.expenseId, list);
  }

  const approvalsByPayment = new Map<string, typeof paymentApprovals>();
  for (const approval of paymentApprovals) {
    const list = approvalsByPayment.get(approval.paymentId) ?? [];
    list.push(approval);
    approvalsByPayment.set(approval.paymentId, list);
  }

  const expenseRows = expenses
    .map((expense) => {
      const approvals = approvalsByExpense.get(expense.id) ?? [];
      const approvalStatus = computeApprovalStatus(approvals);
      const userApproval = approvals.find((a) => a.userId === userId);
      if (!userApproval || userApproval.status !== "pending") return null;
      const list = participantsByExpense.get(expense.id) ?? [];
      const participantsLabel =
        list.length === 0
          ? "—"
          : list.map((p) => userNameById[p.userId] ?? p.userId).join(", ");

      return {
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        paidByName: userNameById[expense.paidById] ?? expense.paidById,
        participantsLabel,
        createdAt: expense.createdAt ?? null,
        approvalStatus,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      title: string;
      amount: number;
      paidByName: string;
      participantsLabel: string;
      createdAt: Date | null;
      approvalStatus: "pending" | "approved" | "rejected";
    }>;

  const paymentRows = payments
    .map((payment) => {
      const approvals = approvalsByPayment.get(payment.id) ?? [];
      const approvalStatus = computeApprovalStatus(approvals);
      const userApproval = approvals.find((a) => a.userId === userId);
      if (!userApproval || userApproval.status !== "pending") return null;
      return {
        id: payment.id,
        fromName: userNameById[payment.fromUserId] ?? payment.fromUserId,
        toName: userNameById[payment.toUserId] ?? payment.toUserId,
        amount: payment.amount,
        createdAt: payment.createdAt ?? null,
        approvalStatus,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      fromName: string;
      toName: string;
      amount: number;
      createdAt: Date | null;
      approvalStatus: "pending" | "approved" | "rejected";
    }>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.pendingExpenses}</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t.noPendingExpenseApprovals}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.title}</TableHead>
                  <TableHead>
                    {t.amount} ({t.egp})
                  </TableHead>
                  <TableHead>{t.paidBy}</TableHead>
                  <TableHead>{t.participants}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.created}</TableHead>
                  <TableHead className="text-left">{t.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      <Link href={`/${locale}/expenses?focus=${row.id}`}>{row.title}</Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Money cents={row.amount} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="max-w-[160px] truncate" title={row.paidByName}>
                        {row.paidByName}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.participantsLabel}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{t.pending}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.createdAt ? formatDateTime(row.createdAt, locale) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-left">
                      <div className="flex justify-end gap-2">
                        <form action={approveExpense}>
                          <input type="hidden" name="expenseId" value={row.id} />
                          <Button type="submit" size="sm" className="cursor-pointer">
                            {t.approve}
                          </Button>
                        </form>
                        <form action={rejectExpense}>
                          <input type="hidden" name="expenseId" value={row.id} />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                          >
                            {t.reject}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.pendingPayments}</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t.noPendingPaymentApprovals}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.from}</TableHead>
                  <TableHead>{t.to}</TableHead>
                  <TableHead>
                    {t.amount} ({t.egp})
                  </TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.created}</TableHead>
                  <TableHead className="text-left">{t.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      <span className="max-w-[160px] truncate" title={row.fromName}>
                        {row.fromName}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="max-w-[160px] truncate" title={row.toName}>
                        {row.toName}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Money cents={row.amount} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{t.pending}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.createdAt ? formatDateTime(row.createdAt, locale) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-left">
                      <div className="flex justify-end gap-2">
                        <form action={approvePayment}>
                          <input type="hidden" name="paymentId" value={row.id} />
                          <Button type="submit" size="sm" className="cursor-pointer">
                            {t.approve}
                          </Button>
                        </form>
                        <form action={rejectPayment}>
                          <input type="hidden" name="paymentId" value={row.id} />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                          >
                            {t.reject}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
