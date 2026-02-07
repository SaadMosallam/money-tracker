import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseRow } from "@/components/business/expense/ExpenseRow";
import { Dictionary } from "@/lib/i18n";

type ExpenseRowData = {
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

type ExpenseListProps = {
  rows: ExpenseRowData[];
  title?: string;
  emptyMessage?: string;
  variant?: "card" | "plain";
  showTitle?: boolean;
  t: Dictionary;
};

export function ExpenseList({
  rows,
  title,
  emptyMessage,
  variant = "card",
  showTitle = true,
  t,
}: ExpenseListProps) {
  const resolvedTitle = title ?? t.allExpenses;
  const resolvedEmptyMessage = emptyMessage ?? t.noExpensesYet;
  const content = rows.length === 0 ? (
    <div className="text-sm text-muted-foreground">{resolvedEmptyMessage}</div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.title}</TableHead>
          <TableHead>
            {t.amount} ({t.egp})
          </TableHead>
          <TableHead className="whitespace-nowrap">{t.paidBy}</TableHead>
          <TableHead>{t.participants}</TableHead>
          <TableHead>{t.status}</TableHead>
          <TableHead>{t.approval}</TableHead>
          <TableHead>{t.created}</TableHead>
          <TableHead className="whitespace-nowrap text-left">
            {t.action}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <ExpenseRow key={row.id} {...row} t={t} />
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
