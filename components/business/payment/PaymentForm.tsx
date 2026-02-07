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
};

type PaymentListProps = {
  rows: PaymentRowData[];
  t: Dictionary;
};

export function PaymentList({ rows, t }: PaymentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.allPayments}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t.noPaymentsYet}
          </div>
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
                <PaymentRow key={row.id} {...row} t={t} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
