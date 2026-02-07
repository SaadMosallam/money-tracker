import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { markSettled } from "@/lib/actions/markSettled";
import { approveExpense, rejectExpense } from "@/lib/actions/approvals";
import { Money } from "@/components/business/primitives/Money";
import { UserLabel } from "@/components/business/primitives/UserLabel";
import { formatDateTime } from "@/lib/utils/date";
import { Dictionary } from "@/lib/i18n";

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
  t: Dictionary;
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
  t,
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
          {isSettled ? t.settled : t.unsettled}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge
          variant={approvalBadge}
          className={approvalStatus === "rejected" ? "text-white" : undefined}
        >
          {approvalStatus === "approved"
            ? t.approved
            : approvalStatus === "rejected"
              ? t.rejected
              : t.pending}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {createdAt ? formatDateTime(createdAt) : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-left">
        {canApprove ? (
          <div className="flex justify-end gap-2">
            <form action={approveExpense}>
              <input type="hidden" name="expenseId" value={id} />
              <Button type="submit" size="sm" className="cursor-pointer">
                {t.approve}
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
                {t.reject}
              </Button>
            </form>
          </div>
        ) : isSettled ? (
          <span className="text-sm text-muted-foreground">{t.settled}</span>
        ) : (
          <form action={markSettled}>
            <input type="hidden" name="expenseId" value={id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              {t.markSettled}
            </Button>
          </form>
        )}
      </TableCell>
    </TableRow>
  );
}
