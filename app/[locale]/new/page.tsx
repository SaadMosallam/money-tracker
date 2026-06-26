import { getUsers } from "@/lib/db/queries/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary, Locale } from "@/lib/i18n";
import { createExpense } from "@/lib/actions/createExpense";
import { createPayment } from "@/lib/actions/createPayment";
import { NewClient } from "@/components/business/new/NewClient";

type NewPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function NewPage({ params }: NewPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const [users, session] = await Promise.all([
    getUsers(),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id ?? "";
  const currentUserName = session?.user?.name ?? "";

  return (
    <NewClient
      locale={locale}
      t={t}
      users={users}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      createExpense={createExpense}
      createPayment={createPayment}
    />
  );
}
