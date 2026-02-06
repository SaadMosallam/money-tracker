import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseRow } from "@/components/business/expense/ExpenseRow";

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
};

export function ExpenseList({
  rows,
  title = "All Expenses",
  emptyMessage = "No expenses yet.",
  variant = "card",
  showTitle = true,
}: ExpenseListProps) {
  const content = rows.length === 0 ? (
    <div className="text-sm text-muted-foreground">{emptyMessage}</div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="whitespace-nowrap">Paid By</TableHead>
          <TableHead>Participants</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Approval</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="whitespace-nowrap text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <ExpenseRow key={row.id} {...row} />
        ))}
      </TableBody>
    </Table>
  );

  if (variant === "plain") {
    return (
      <div className="space-y-4">
        {showTitle && <h3 className="text-lg font-semibold">{title}</h3>}
        {content}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{content}</CardContent>
    </Card>
  );
}
