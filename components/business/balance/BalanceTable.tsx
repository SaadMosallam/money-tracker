import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money } from "@/components/business/primitives/Money";
import { UserLabel } from "@/components/business/primitives/UserLabel";
import { Dictionary } from "@/lib/i18n";

type BalanceRow = {
  userId: string;
  name: string;
  imageUrl?: string | null;
  balance: number;
};

type BalanceTableProps = {
  rows: BalanceRow[];
  t: Dictionary;
};

export function BalanceTable({ rows, t }: BalanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.balances}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.user}</TableHead>
              <TableHead className="text-left">
                {t.balance} ({t.egp})
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <UserLabel
                    name={row.name}
                    imageUrl={row.imageUrl ?? null}
                    showAvatar
                  />
                </TableCell>
                <TableCell className="text-left">
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
