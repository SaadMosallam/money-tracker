import { getBalances } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";

import { PageContainer } from "@/components/business/layout/PageContainer";
import { BalanceTable, PairwiseDebts } from "@/components/business/balance";
import { buildUserById } from "@/lib/utils/userById";
import { defaultLocale, getDictionary } from "@/lib/i18n";

export default async function Home() {
  const t = getDictionary(defaultLocale);
  const [balances, users] = await Promise.all([getBalances(), getUsers()]);

  const userById = buildUserById(users);

  const balanceRows = Object.entries(balances).map(([userId, balance]) => ({
    userId,
    name: userById[userId]?.name ?? userId,
    imageUrl: userById[userId]?.avatarUrl ?? null,
    balance,
  }));

  return (
    <PageContainer title={t.dashboard}>
      <div className="space-y-8">
        <BalanceTable rows={balanceRows} t={t} locale={defaultLocale} />
        <PairwiseDebts
          balances={balances}
          userById={userById}
          t={t}
          locale={defaultLocale}
        />
      </div>
    </PageContainer>
  );
}
