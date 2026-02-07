import { PageContainer } from "@/components/business/layout/PageContainer";
import { getDictionary, Locale } from "@/lib/i18n";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <PageContainer title={t.resetPassword} maxWidthClassName="max-w-md">
      <ForgotPasswordForm locale={locale} t={t} />
    </PageContainer>
  );
}
