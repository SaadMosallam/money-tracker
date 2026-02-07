import { getBalances } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";

import { PageContainer } from "@/components/business/layout/PageContainer";
import { BalanceTable, PairwiseDebts } from "@/components/business/balance";
import { buildUserById } from "@/lib/utils/userById";
import { getDictionary, Locale } from "@/lib/i18n";

type HomePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
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
        <BalanceTable rows={balanceRows} t={t} />
        <PairwiseDebts balances={balances} userById={userById} t={t} />
      </div>
    </PageContainer>
  );
}
