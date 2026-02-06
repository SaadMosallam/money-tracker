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

type UserOption = {
  id: string;
  name: string;
};

type PaymentCreateFormProps = {
  users: UserOption[];
  action: (formData: FormData) => void;
  currentUserId: string;
  currentUserName: string;
};

export function PaymentCreateForm({
  users,
  action,
  currentUserId,
  currentUserName,
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
    return currentUserName || "Unknown user";
  }, [currentUserName]);

  const toUserLabel = useMemo(() => {
    return users.find((user) => user.id === toUserId)?.name ?? "Select user";
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
          nextErrors.toUserId = "To must be different.";
          setErrorMessage("Please select two different users.");
        }
        const amountCents = parseCurrencyToCents(amount);
        if (!amountCents || amountCents <= 0) {
          nextErrors.amount = "Amount is required.";
          setErrorMessage("Please enter a valid amount.");
        }
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          toast.error("Please fix the highlighted fields.");
          return;
        }
        await action(formData);
        toast.success("Payment added successfully.");
      } catch (error) {
        if (isNextRedirect(error)) {
          toast.success("Payment added successfully.");
          return;
        }
        console.error(error);
        setFieldErrors({});
        setErrorMessage("Something went wrong. Please try again.");
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  if (!hasUsers || !hasCurrentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasUsers
              ? "Sign in before creating payments."
              : "Add users first before creating payments."}
          </p>
        </CardContent>
      </Card>
    );
  }
  if (availableRecipients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add at least one other user before creating payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="fromUserId" value={currentUserId} />
          <input type="hidden" name="toUserId" value={toUserId} />
          <input type="hidden" name="amount" value={parseCurrencyToCents(amount) ?? ""} />

          <FieldGroup>
            <Field>
              <FieldLabel>
                From <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input value={fromUserLabel} readOnly />
              </FieldContent>
              <FieldDescription>Who paid the money.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>
                To <span className="text-destructive">*</span>
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
              <FieldDescription>Who received the money.</FieldDescription>
              {fieldErrors.toUserId && (
                <FieldError>{fieldErrors.toUserId}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">
                Amount (EGP) <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="100.00"
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
              <FieldDescription>Up to 2 decimals (e.g. 125.50).</FieldDescription>
              {fieldErrors.amount && <FieldError>{fieldErrors.amount}</FieldError>}
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending ? "Creating..." : "Create Payment"}
          </Button>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </form>
      </CardContent>
    </Card>
  );
}
