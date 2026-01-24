import { TableCell, TableRow } from "@/components/ui/table";
import { Money } from "@/components/business/primitives/Money";
import { UserLabel } from "@/components/business/primitives/UserLabel";

type PaymentRowProps = {
  id: string;
  fromName: string;
  toName: string;
  amount: number;
  createdAt: Date | null;
};

export function PaymentRow({
  id,
  fromName,
  toName,
  amount,
  createdAt,
}: PaymentRowProps) {
  return (
    <TableRow key={id}>
      <TableCell className="whitespace-nowrap">
        <UserLabel name={fromName} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <UserLabel name={toName} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Money cents={amount} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {createdAt ? createdAt.toLocaleDateString() : "—"}
      </TableCell>
    </TableRow>
  );
}
