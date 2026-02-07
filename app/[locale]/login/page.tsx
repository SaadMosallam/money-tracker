import { LoginForm } from "@/components/auth/LoginForm";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { Suspense } from "react";
import { getDictionary, Locale } from "@/lib/i18n";

type LoginPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return (
    <PageContainer title={t.signIn} maxWidthClassName="max-w-md">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm locale={locale} t={t} />
      </Suspense>
    </PageContainer>
  );
}
