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

type ApprovalsPanelProps = {
  userId: string;
};

export default async function ApprovalsPanel({ userId }: ApprovalsPanelProps) {
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
          <CardTitle>Pending Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No pending expense approvals.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      <Link href={`/expenses?focus=${row.id}`}>{row.title}</Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Money cents={row.amount} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.paidByName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.participantsLabel}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">Pending</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.createdAt ? formatDateTime(row.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <form action={approveExpense}>
                          <input type="hidden" name="expenseId" value={row.id} />
                          <Button type="submit" size="sm" className="cursor-pointer">
                            Approve
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
                            Reject
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
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No pending payment approvals.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.fromName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.toName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Money cents={row.amount} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">Pending</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.createdAt ? formatDateTime(row.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <form action={approvePayment}>
                          <input type="hidden" name="paymentId" value={row.id} />
                          <Button type="submit" size="sm" className="cursor-pointer">
                            Approve
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
                            Reject
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
