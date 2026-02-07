import { PageContainer } from "@/components/business/layout/PageContainer";
import { getDictionary, Locale } from "@/lib/i18n";
import { resetPassword } from "@/lib/actions/passwordReset";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ResetPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const search = await searchParams;
  const token = search?.token ?? "";

  return (
    <PageContainer title={t.resetPassword} maxWidthClassName="max-w-md">
      <form action={resetPassword} className="space-y-4">
        <Input name="token" type="hidden" value={token} />
        <Input
          name="newPassword"
          type="password"
          placeholder={t.newPasswordLabel}
        />
        <Input
          name="confirmPassword"
          type="password"
          placeholder={t.confirmNewPasswordLabel}
        />
        <Button type="submit" className="w-full cursor-pointer">
          {t.setNewPassword}
        </Button>
      </form>
    </PageContainer>
  );
}
