import { createPayment } from "@/lib/actions/createPayment";
import { getUsers } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { PaymentCreateForm } from "@/components/business/payment/PaymentCreateForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary, Locale } from "@/lib/i18n";

type NewPaymentPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function NewPaymentPage({ params }: NewPaymentPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const [users, session] = await Promise.all([
    getUsers(),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id ?? "";
  const currentUserName = session?.user?.name ?? "";

  return (
    <PageContainer title={t.newPayment}>
      <PaymentCreateForm
        users={users}
        action={createPayment}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        locale={locale}
        t={t}
      />
    </PageContainer>
  );
}
