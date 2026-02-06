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
import type { BalanceByUserId } from "@/lib/types/expensesTypes";

type PairwiseDebt = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

type PairwiseDebtsProps = {
  balances: BalanceByUserId;
  userById: Record<
    string,
    {
      id: string;
      name: string;
      avatarUrl?: string | null;
    }
  >;
};

const buildPairwiseDebts = (balances: BalanceByUserId): PairwiseDebt[] => {
  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0)
    .map(([userId, balance]) => ({ userId, remaining: balance }))
    .sort((a, b) => {
      if (b.remaining !== a.remaining) return b.remaining - a.remaining;
      return a.userId.localeCompare(b.userId);
    });

  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < 0)
    .map(([userId, balance]) => ({ userId, remaining: Math.abs(balance) }))
    .sort((a, b) => {
      if (b.remaining !== a.remaining) return b.remaining - a.remaining;
      return a.userId.localeCompare(b.userId);
    });

  const transfers: PairwiseDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    transfers.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount,
    });

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining === 0) i += 1;
    if (creditor.remaining === 0) j += 1;
  }

  return transfers;
};

export function PairwiseDebts({ balances, userById }: PairwiseDebtsProps) {
  const transfers = buildPairwiseDebts(balances);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pairwise Debts</CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Everyone is settled up.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer, index) => (
                <TableRow
                  key={`${transfer.fromUserId}-${transfer.toUserId}-${index}`}
                >
                  <TableCell>
                    <UserLabel
                      name={userById[transfer.fromUserId]?.name ?? transfer.fromUserId}
                      imageUrl={userById[transfer.fromUserId]?.avatarUrl ?? null}
                      showAvatar
                    />
                  </TableCell>
                  <TableCell>
                    <UserLabel
                      name={userById[transfer.toUserId]?.name ?? transfer.toUserId}
                      imageUrl={userById[transfer.toUserId]?.avatarUrl ?? null}
                      showAvatar
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money cents={transfer.amount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
