import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { markSettled } from "@/lib/actions/markSettled";
import { Money } from "@/components/business/primitives/Money";
import { UserLabel } from "@/components/business/primitives/UserLabel";

type ExpenseRowProps = {
  id: string;
  title: string;
  amount: number;
  paidByName: string;
  participantsLabel: string;
  isSettled: boolean;
  createdAt: Date | null;
};

export function ExpenseRow({
  id,
  title,
  amount,
  paidByName,
  participantsLabel,
  isSettled,
  createdAt,
}: ExpenseRowProps) {
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
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {createdAt ? createdAt.toLocaleDateString() : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {isSettled ? (
          <span className="text-sm text-muted-foreground">Settled</span>
        ) : (
          <form action={markSettled}>
            <input type="hidden" name="expenseId" value={id} />
            <Button type="submit" variant="outline" size="sm">
              Mark Settled
            </Button>
          </form>
        )}
      </TableCell>
    </TableRow>
  );
}
