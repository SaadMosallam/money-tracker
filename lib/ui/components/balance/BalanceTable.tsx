import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money } from "@/lib/ui/components/primitives/Money";
import { UserLabel } from "@/lib/ui/components/primitives/UserLabel";

type BalanceRow = {
  userId: string;
  name: string;
  balance: number;
};

type BalanceTableProps = {
  rows: BalanceRow[];
};

export function BalanceTable({ rows }: BalanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <UserLabel name={row.name} />
                </TableCell>
                <TableCell className="text-right">
                  <Money cents={row.balance} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
