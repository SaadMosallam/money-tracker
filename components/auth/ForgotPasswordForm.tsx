"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { requestPasswordReset } from "@/lib/actions/passwordReset";
import { isNextRedirect } from "@/lib/utils/isRedirectError";

type ForgotPasswordFormProps = {
  locale: string;
  t: Dictionary;
};

export function ForgotPasswordForm({ locale, t }: ForgotPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          try {
            await requestPasswordReset(formData);
            toast.success(t.resetLinkSent);
            router.push(`/${locale}/login`);
          } catch (error) {
            if (isNextRedirect(error)) {
              toast.success(t.resetLinkSent);
              return;
            }
            console.error(error);
            toast.error(t.somethingWentWrong);
          }
        });
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        {t.resetPasswordInstructions}
      </p>
      <Input name="email" type="email" placeholder={t.emailPlaceholder} />
      <Button
        type="submit"
        className="w-full cursor-pointer"
        disabled={isPending}
      >
        {isPending ? t.saving : t.sendResetLink}
      </Button>
    </form>
  );
}
