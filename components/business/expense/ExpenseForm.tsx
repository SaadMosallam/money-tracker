"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { parseCurrencyToCents, sanitizeCurrencyInput } from "@/lib/utils/currency";
import { isNextRedirect } from "@/lib/utils/isRedirectError";
import { Dictionary } from "@/lib/i18n";

type UserOption = {
  id: string;
  name: string;
};

type ExpenseFormProps = {
  users: UserOption[];
  action: (formData: FormData) => void;
  currentUserId: string;
  currentUserName: string;
  locale: string;
  t: Dictionary;
};

type ParticipantState = Record<
  string,
  {
    selected: boolean;
    share: string;
  }
>;

export function ExpenseForm({
  users,
  action,
  currentUserId,
  currentUserName,
  locale,
  t,
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    amount?: string;
    participants?: string;
  }>({});
  const [amount, setAmount] = useState("");
  const [participants, setParticipants] = useState<ParticipantState>(() => {
    const initial: ParticipantState = {};
    for (const user of users) {
      initial[user.id] = { selected: true, share: "" };
    }
    return initial;
  });

  // Build participant weights from exact shares.
  // - If a user entered a share amount, weight = that exact share (in cents).
  // - Remaining amount is split equally across users with no share entered.
  // - If no total amount is provided, all selected users default to weight 1.
  const buildParticipantsPayload = useMemo(() => {
    return (amountCents: number | null) => {
      const selected = Object.entries(participants)
        .filter(([, value]) => value.selected)
        .map(([userId, value]) => ({ userId, share: value.share.trim() }));

      if (!amountCents || amountCents <= 0) {
        return selected.map((entry) => ({ userId: entry.userId, weight: 1 }));
      }

      const specified = selected
        .map((entry) => ({
          userId: entry.userId,
          shareCents: entry.share ? parseCurrencyToCents(entry.share) : null,
        }))
        .filter((entry) => entry.shareCents && entry.shareCents > 0) as Array<{
          userId: string;
          shareCents: number;
        }>;

      const specifiedIds = new Set(specified.map((entry) => entry.userId));
      const unspecified = selected.filter(
        (entry) => !specifiedIds.has(entry.userId)
      );

      const specifiedTotal = specified.reduce(
        (sum, entry) => sum + entry.shareCents,
        0
      );
      const remaining = amountCents - specifiedTotal;

      const result: Array<{ userId: string; weight: number }> = [];

      for (const entry of specified) {
        result.push({ userId: entry.userId, weight: entry.shareCents });
      }

      if (unspecified.length > 0) {
        const base = Math.floor(remaining / unspecified.length);
        let remainder = remaining - base * unspecified.length;
        const ordered = [...unspecified].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        );
        for (const entry of ordered) {
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder -= 1;
          result.push({ userId: entry.userId, weight: base + extra });
        }
      }

      return result;
    };
  }, [participants]);

  const hasUsers = users.length > 0;
  const hasCurrentUser = Boolean(currentUserId);
  const participantsPayload = useMemo(() => {
    const amountCents = parseCurrencyToCents(amount);
    return buildParticipantsPayload(amountCents);
  }, [amount, buildParticipantsPayload]);

  const paidByLabel = currentUserName || t.unknownUser;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        setErrorMessage(null);
        setFieldErrors({});
        const title = String(formData.get("title") ?? "").trim();
        const selectedCount = Object.values(participants).filter(
          (p) => p.selected
        ).length;

        const nextErrors: typeof fieldErrors = {};
        if (!title) {
          nextErrors.title = t.expenseTitleRequired;
        }
        const amountCents = parseCurrencyToCents(amount);
        if (!amountCents || amountCents <= 0) {
          nextErrors.amount = t.expenseAmountRequired;
          setErrorMessage(t.enterValidAmount);
        }
        if (selectedCount === 0) {
          nextErrors.participants = t.selectAtLeastOneParticipant;
        }
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          toast.error(t.fixHighlightedFields);
          return;
        }
        if (!amountCents) {
          return;
        }
        const invalidShare = Object.values(participants).some((p) => {
          if (!p.selected || !p.share) return false;
          const cents = parseCurrencyToCents(p.share);
          return !cents || cents <= 0;
        });
        if (invalidShare) {
          setFieldErrors((prev) => ({
            ...prev,
            participants: t.participantSharesInvalid,
          }));
          setErrorMessage(t.participantSharesInvalid);
          toast.error(t.participantSharesInvalid);
          return;
        }

        const validAmountCents = amountCents;
        const computedParticipants = buildParticipantsPayload(validAmountCents);
        const computedTotal = computedParticipants.reduce(
          (sum, entry) => sum + entry.weight,
          0
        );

        if (computedTotal < validAmountCents) {
          setFieldErrors((prev) => ({
            ...prev,
            participants: t.allocatedLess,
          }));
          setErrorMessage(t.allocatedLess);
          toast.error(t.allocatedLess);
          return;
        }
        if (computedTotal > validAmountCents) {
          setFieldErrors((prev) => ({
            ...prev,
            participants: t.allocatedMore,
          }));
          setErrorMessage(t.allocatedMore);
          toast.error(t.allocatedMore);
          return;
        }

        formData.set("participants", JSON.stringify(computedParticipants));
        formData.set("amount", String(validAmountCents));
        await action(formData);
        toast.success(t.expenseAdded);
      } catch (error) {
        if (isNextRedirect(error)) {
          toast.success(t.expenseAdded);
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
          <CardTitle>{t.newExpenseTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasUsers
              ? t.signInBeforeCreatingExpenses
              : t.addUsersBeforeCreatingExpenses}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.newExpenseTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="hidden"
            name="participants"
            value={JSON.stringify(participantsPayload)}
          />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="paidById" value={currentUserId} />
          <input type="hidden" name="amount" value={parseCurrencyToCents(amount) ?? ""} />

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">
                {t.title} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="title"
                  name="title"
                  placeholder={t.dinnerPlaceholder}
                  className={
                    fieldErrors.title
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                  onChange={() => {
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                />
              </FieldContent>
              {fieldErrors.title && <FieldError>{fieldErrors.title}</FieldError>}
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

            <Field>
              <FieldLabel>{t.paidByLabel}</FieldLabel>
              <FieldContent>
                <Input value={paidByLabel} readOnly />
              </FieldContent>
              <FieldDescription>
                {t.paidByHelp}
              </FieldDescription>
            </Field>
          </FieldGroup>

          <FieldSet>
            <FieldLegend>
              {t.participantsLabel} <span className="text-destructive">*</span>
            </FieldLegend>
            <FieldGroup className="flex align-center justify-center">
              {users.map((user) => {
                const state = participants[user.id];
                return (
                  <Field key={user.id} orientation="horizontal" className="items-center">
                    <FieldLabel className="cursor-pointer">
                      <Checkbox
                        checked={state?.selected ?? false}
                        onCheckedChange={(
                          checked: boolean | "indeterminate"
                        ) => {
                          const selected = checked === true;
                          setParticipants((prev) => ({
                            ...prev,
                            [user.id]: {
                              selected,
                              share: prev[user.id]?.share ?? "",
                            },
                          }));
                          if (fieldErrors.participants) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              participants: undefined,
                            }));
                          }
                        }}
                        id={`participant-${user.id}`}
                      />
                      <span>{user.name}</span>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-24"
                        placeholder={t.participantSharePlaceholder}
                        value={state?.share ?? ""}
                        onChange={(event) => {
                          setParticipants((prev) => ({
                            ...prev,
                            [user.id]: {
                              selected: prev[user.id]?.selected ?? false,
                              share: sanitizeCurrencyInput(event.target.value),
                            },
                          }));
                          if (fieldErrors.participants) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              participants: undefined,
                            }));
                          }
                        }}
                        disabled={!state?.selected}
                      />
                    </FieldContent>
                  </Field>
                );
              })}
            </FieldGroup>
            <FieldDescription>
              {t.participantsHelp}
            </FieldDescription>
            {fieldErrors.participants && (
              <FieldError>{fieldErrors.participants}</FieldError>
            )}
          </FieldSet>

          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending ? t.creating : t.createExpense}
          </Button>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </form>
      </CardContent>
    </Card>
  );
}
