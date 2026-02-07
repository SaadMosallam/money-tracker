import { PageContainer } from "@/components/business/layout/PageContainer";
import { getDictionary, Locale } from "@/lib/i18n";
import { requestPasswordReset } from "@/lib/actions/passwordReset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      <form action={requestPasswordReset} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t.resetPasswordInstructions}
        </p>
        <Input name="email" type="email" placeholder={t.emailPlaceholder} />
        <Button type="submit" className="w-full cursor-pointer">
          {t.sendResetLink}
        </Button>
      </form>
    </PageContainer>
  );
}
