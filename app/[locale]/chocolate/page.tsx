import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getUsers } from "@/lib/db/queries/users";
import { getChocolateBars, getChocolateBalances } from "@/lib/db/queries/chocolate";
import { ChocolateClient } from "@/components/business/chocolate/ChocolateClient";

export default async function ChocolatePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const [session, users, bars, balances] = await Promise.all([
    getServerSession(authOptions),
    getUsers(),
    getChocolateBars(),
    getChocolateBalances(),
  ]);

  const currentUserId = session?.user?.id ?? "";
  const currentUserName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <ChocolateClient
      locale={locale}
      t={t}
      users={users}
      bars={bars}
      balances={balances}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
    />
  );
}
