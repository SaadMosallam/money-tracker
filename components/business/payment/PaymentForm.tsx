import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentRow } from "@/components/business/payment/PaymentRow";
import { Dictionary } from "@/lib/i18n";

type PaymentRowData = {
  id: string;
  fromName: string;
  toName: string;
  amount: number;
  createdAt: Date | null;
  approvalStatus: "pending" | "approved" | "rejected";
  canApprove: boolean;
  isSettled: boolean;
};

type PaymentListProps = {
  rows: PaymentRowData[];
  t: Dictionary;
  locale: string;
  title?: string;
  emptyMessage?: string;
  variant?: "card" | "plain";
  showTitle?: boolean;
};

export function PaymentList({
  rows,
  t,
  locale,
  title,
  emptyMessage,
  variant = "card",
  showTitle = true,
}: PaymentListProps) {
  const resolvedTitle = title ?? t.allPayments;
  const resolvedEmpty = emptyMessage ?? t.noPaymentsYet;
  const content =
    rows.length === 0 ? (
      <div className="text-sm text-muted-foreground">{resolvedEmpty}</div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">{t.from}</TableHead>
            <TableHead className="whitespace-nowrap">{t.to}</TableHead>
            <TableHead className="whitespace-nowrap">
              {t.amount} ({t.egp})
            </TableHead>
            <TableHead className="whitespace-nowrap">{t.approval}</TableHead>
            <TableHead className="whitespace-nowrap">{t.created}</TableHead>
            <TableHead className="whitespace-nowrap text-left">
              {t.action}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <PaymentRow key={row.id} {...row} t={t} locale={locale} />
          ))}
        </TableBody>
      </Table>
    );

  if (variant === "plain") {
    return (
      <div className="space-y-4">
        {showTitle && (
          <h3 className="text-lg font-semibold">{resolvedTitle}</h3>
        )}
        {content}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>{resolvedTitle}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{content}</CardContent>
    </Card>
  );
}
