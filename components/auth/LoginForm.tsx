"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/lib/i18n";
import Link from "next/link";

type LoginFormProps = {
  locale: string;
  t: Dictionary;
};

export function LoginForm({ locale, t }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}`;
  const authError = searchParams.get("error");

  useEffect(() => {
    if (!searchParams.get("callbackUrl")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("callbackUrl", `/${locale}`);
      router.replace(`/${locale}/login?${params.toString()}`);
    }
  }, [router, searchParams, locale]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage(t.emailAndPasswordRequired);
      return;
    }

    startTransition(async () => {
      const result = await signIn("credentials", {
        redirect: true,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setErrorMessage(t.invalidEmailPassword);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.signInTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>{t.emailOrUsername}</FieldLabel>
                <FieldContent>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.emailOrUsernamePlaceholder}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{t.currentPassword}</FieldLabel>
                <FieldContent>
                  <Input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t.passwordPlaceholder}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
            {(errorMessage || authError) && (
              <FieldError>
                {errorMessage ?? t.signInFailed}
              </FieldError>
            )}
          </FieldSet>
          <Button
            type="submit"
            className="w-full cursor-pointer disabled:cursor-not-allowed"
            disabled={isPending}
          >
            {isPending ? t.signingIn : t.signInTitle}
          </Button>
          <div className="text-center">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {t.forgotPassword}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
