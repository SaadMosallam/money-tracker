"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { parseCurrencyToCents, sanitizeCurrencyInput } from "@/lib/utils/currency";
import { isNextRedirect } from "@/lib/utils/isRedirectError";
import { Dictionary } from "@/lib/i18n";
import { Dictionary } from "@/lib/i18n";

type UserOption = {
  id: string;
  name: string;
};

type PaymentCreateFormProps = {
  users: UserOption[];
  action: (formData: FormData) => void;
  currentUserId: string;
  currentUserName: string;
  locale: string;
  t: Dictionary;
};

export function PaymentCreateForm({
  t,
  users,
  action,
  currentUserId,
  currentUserName,
  locale,
}: PaymentCreateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    toUserId?: string;
    amount?: string;
  }>({});
  const [amount, setAmount] = useState("");
  const [toUserId, setToUserId] = useState(
    users.find((user) => user.id !== currentUserId)?.id ?? ""
  );

  const hasUsers = users.length > 0;
  const hasCurrentUser = Boolean(currentUserId);
  const availableRecipients = users.filter((user) => user.id !== currentUserId);

  const fromUserLabel = useMemo(() => {
    return currentUserName || t.unknownUser;
  }, [currentUserName]);

  const toUserLabel = useMemo(() => {
    return users.find((user) => user.id === toUserId)?.name ?? t.selectUser;
  }, [users, toUserId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        setErrorMessage(null);
        setFieldErrors({});
        const nextErrors: typeof fieldErrors = {};
        if (!currentUserId || !toUserId || currentUserId === toUserId) {
          nextErrors.toUserId = t.toMustBeDifferent;
          setErrorMessage(t.selectTwoDifferentUsers);
        }
        const amountCents = parseCurrencyToCents(amount);
        if (!amountCents || amountCents <= 0) {
          nextErrors.amount = t.expenseAmountRequired;
          setErrorMessage(t.enterValidAmount);
        }
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          toast.error(t.fixHighlightedFields);
          return;
        }
        await action(formData);
        toast.success(t.paymentAdded);
      } catch (error) {
        if (isNextRedirect(error)) {
          toast.success(t.paymentAdded);
          return;
        }
        console.error(error);
        setFieldErrors({});
        setErrorMessage(t.somethingWentWrong);
        toast.error(t.somethingWentWrong);
      }
    });
  };

  if (!hasUsers || !hasCurrentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.newPaymentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasUsers
              ? t.signInBeforeCreatingPayments
              : t.addUsersBeforeCreatingPayments}
          </p>
        </CardContent>
      </Card>
    );
  }
  if (availableRecipients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.newPaymentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.addAnotherUserBeforePayments}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.newPaymentTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="fromUserId" value={currentUserId} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="toUserId" value={toUserId} />
          <input type="hidden" name="amount" value={parseCurrencyToCents(amount) ?? ""} />

          <FieldGroup>
            <Field>
              <FieldLabel>
                {t.fromLabel} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input value={fromUserLabel} readOnly />
              </FieldContent>
              <FieldDescription>{t.fromHelp}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>
                {t.toLabel} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-between cursor-pointer ${fieldErrors.toUserId
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                        }`}
                    >
                      {toUserLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
                    <DropdownMenuRadioGroup
                      value={toUserId}
                      onValueChange={(value) => {
                        setToUserId(value);
                        if (fieldErrors.toUserId) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            toUserId: undefined,
                          }));
                        }
                      }}
                    >
                      {availableRecipients.map((user) => (
                        <DropdownMenuRadioItem
                          key={user.id}
                          value={user.id}
                        >
                          {user.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldContent>
              <FieldDescription>{t.toHelp}</FieldDescription>
              {fieldErrors.toUserId && (
                <FieldError>{fieldErrors.toUserId}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">
                {t.amountLabel} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder={t.amountPlaceholder}
                  value={amount}
                  onChange={(event) => {
                    setAmount(sanitizeCurrencyInput(event.target.value));
                    if (fieldErrors.amount) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        amount: undefined,
                      }));
                    }
                  }}
                  className={
                    fieldErrors.amount
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                />
              </FieldContent>
              <FieldDescription>{t.amountHelp}</FieldDescription>
              {fieldErrors.amount && <FieldError>{fieldErrors.amount}</FieldError>}
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending ? t.creating : t.createPayment}
          </Button>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </form>
      </CardContent>
    </Card>
  );
}
