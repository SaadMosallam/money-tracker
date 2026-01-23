import { getBalances } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";

import { PageContainer } from "@/lib/ui/components/layout/PageContainer";
import { BalanceTable, PairwiseDebts } from "@/lib/ui/components/balance";

export default async function DashboardPage() {
  const [balances, users] = await Promise.all([getBalances(), getUsers()]);

  const userNameById = users.reduce<Record<string, string>>((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {});

  const balanceRows = Object.entries(balances).map(([userId, balance]) => ({
    userId,
    name: userNameById[userId] ?? userId,
    balance,
  }));

  return (
    <PageContainer title="Dashboard">
      <div className="space-y-8">
        <BalanceTable rows={balanceRows} />
        <PairwiseDebts balances={balances} userNameById={userNameById} />
      </div>
    </PageContainer>
  );
}
