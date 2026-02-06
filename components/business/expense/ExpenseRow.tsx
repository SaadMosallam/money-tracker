import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { markSettled } from "@/lib/actions/markSettled";
import { approveExpense, rejectExpense } from "@/lib/actions/approvals";
import { Money } from "@/components/business/primitives/Money";
import { UserLabel } from "@/components/business/primitives/UserLabel";
import { formatDateTime } from "@/lib/utils/date";

type ExpenseRowProps = {
  id: string;
  title: string;
  amount: number;
  paidByName: string;
  participantsLabel: string;
  isSettled: boolean;
  createdAt: Date | null;
  approvalStatus: "pending" | "approved" | "rejected";
  canApprove: boolean;
};

export function ExpenseRow({
  id,
  title,
  amount,
  paidByName,
  participantsLabel,
  isSettled,
  createdAt,
  approvalStatus,
  canApprove,
}: ExpenseRowProps) {
  const approvalBadge =
    approvalStatus === "approved"
      ? "secondary"
      : approvalStatus === "rejected"
        ? "destructive"
        : "outline";
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-medium">
        {title}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Money cents={amount} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <UserLabel name={paidByName} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {participantsLabel}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={isSettled ? "secondary" : "outline"}>
          {isSettled ? "Settled" : "Unsettled"}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge
          variant={approvalBadge}
          className={approvalStatus === "rejected" ? "text-white" : undefined}
        >
          {approvalStatus === "approved"
            ? "Approved"
            : approvalStatus === "rejected"
              ? "Rejected"
              : "Pending"}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {createdAt ? formatDateTime(createdAt) : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {canApprove ? (
          <div className="flex justify-end gap-2">
            <form action={approveExpense}>
              <input type="hidden" name="expenseId" value={id} />
              <Button type="submit" size="sm" className="cursor-pointer">
                Approve
              </Button>
            </form>
            <form action={rejectExpense}>
              <input type="hidden" name="expenseId" value={id} />
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
        ) : isSettled ? (
          <span className="text-sm text-muted-foreground">Settled</span>
        ) : (
          <form action={markSettled}>
            <input type="hidden" name="expenseId" value={id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              Mark Settled
            </Button>
          </form>
        )}
      </TableCell>
    </TableRow>
  );
}
