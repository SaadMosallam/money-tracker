import { TableCell, TableRow } from "@/components/ui/table";
import { Money } from "@/components/business/primitives/Money";
import { UserLabel } from "@/components/business/primitives/UserLabel";
import { formatDateTime } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approvePayment, rejectPayment } from "@/lib/actions/approvals";
import { Dictionary } from "@/lib/i18n";
import { markPaymentSettled } from "@/lib/actions/markPaymentSettled";

type PaymentRowProps = {
  id: string;
  fromName: string;
  toName: string;
  amount: number;
  createdAt: Date | null;
  approvalStatus: "pending" | "approved" | "rejected";
  canApprove: boolean;
  isSettled: boolean;
  t: Dictionary;
  locale: string;
};

export function PaymentRow({
  id,
  fromName,
  toName,
  amount,
  createdAt,
  approvalStatus,
  canApprove,
  isSettled,
  t,
  locale,
}: PaymentRowProps) {
  const approvalBadge =
    approvalStatus === "approved"
      ? "secondary"
      : approvalStatus === "rejected"
        ? "destructive"
        : "outline";
  return (
    <TableRow key={id}>
      <TableCell className="whitespace-nowrap">
        <UserLabel name={fromName} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <UserLabel name={toName} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Money cents={amount} locale={locale} />
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
        {createdAt ? formatDateTime(createdAt, locale) : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-left">
        {canApprove ? (
          <div className="flex justify-end gap-2">
            <form action={approvePayment}>
              <input type="hidden" name="paymentId" value={id} />
              <Button type="submit" size="sm" className="cursor-pointer">
                {t.approve}
              </Button>
            </form>
            <form action={rejectPayment}>
              <input type="hidden" name="paymentId" value={id} />
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
        ) : approvalStatus !== "pending" ? (
          <form action={markPaymentSettled}>
            <input type="hidden" name="paymentId" value={id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              {t.markSettled}
            </Button>
          </form>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
