"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { parseCurrencyToCents, sanitizeCurrencyInput } from "@/lib/utils/currency";

type UserOption = {
  id: string;
  name: string;
};

type ExpenseFormProps = {
  users: UserOption[];
  action: (formData: FormData) => void;
};

type ParticipantState = Record<
  string,
  {
    selected: boolean;
    share: string;
  }
>;

export function ExpenseForm({ users, action }: ExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(users[0]?.id ?? "");
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
  const participantsPayload = useMemo(() => {
    const amountCents = parseCurrencyToCents(amount);
    return buildParticipantsPayload(amountCents);
  }, [amount, buildParticipantsPayload]);

  const paidByLabel =
    users.find((user) => user.id === paidById)?.name ?? "Select user";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        if (!paidById) {
          toast.error("Please select who paid for this expense.");
          return;
        }
        const amountCents = parseCurrencyToCents(amount);
        if (!amountCents || amountCents <= 0) {
          toast.error("Please enter a valid amount.");
          return;
        }
        const invalidShare = Object.values(participants).some((p) => {
          if (!p.selected || !p.share) return false;
          const cents = parseCurrencyToCents(p.share);
          return !cents || cents <= 0;
        });
        if (invalidShare) {
          toast.error("Participant shares must be valid amounts.");
          return;
        }

        const computedParticipants = buildParticipantsPayload(amountCents);
        const computedTotal = computedParticipants.reduce(
          (sum, entry) => sum + entry.weight,
          0
        );

        if (computedTotal < amountCents) {
          toast.error("Allocated shares are less than the total amount.");
          return;
        }
        if (computedTotal > amountCents) {
          toast.error("Allocated shares exceed the total amount.");
          return;
        }

        formData.set("participants", JSON.stringify(computedParticipants));
        formData.set("amount", String(amountCents));
        await action(formData);
        toast.success("Expense added successfully.");
        router.push("/");
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  if (!hasUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add users first before creating expenses.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="hidden"
            name="participants"
            value={JSON.stringify(participantsPayload)}
          />
          <input type="hidden" name="paidById" value={paidById} />
          <input type="hidden" name="amount" value={parseCurrencyToCents(amount) ?? ""} />

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <FieldContent>
                <Input id="title" name="title" placeholder="Dinner" required />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Amount (EGP)</FieldLabel>
              <FieldContent>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="100.00"
                  value={amount}
                  onChange={(event) => {
                    setAmount(sanitizeCurrencyInput(event.target.value));
                  }}
                  required
                />
              </FieldContent>
              <FieldDescription>Up to 2 decimals (e.g. 125.50).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Paid By</FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between cursor-pointer">
                      {paidByLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
                    <DropdownMenuRadioGroup
                      value={paidById}
                      onValueChange={setPaidById}
                    >
                      {users.map((user) => (
                        <DropdownMenuRadioItem key={user.id} value={user.id}>
                          {user.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldContent>
              <FieldDescription>Select who paid for this expense.</FieldDescription>
            </Field>
          </FieldGroup>

          <FieldSet>
            <FieldLegend>Participants</FieldLegend>
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
                        placeholder="Share"
                        value={state?.share ?? ""}
                        onChange={(event) => {
                          setParticipants((prev) => ({
                            ...prev,
                            [user.id]: {
                              selected: prev[user.id]?.selected ?? false,
                              share: sanitizeCurrencyInput(event.target.value),
                            },
                          }));
                        }}
                        disabled={!state?.selected}
                      />
                    </FieldContent>
                  </Field>
                );
              })}
            </FieldGroup>
            <FieldDescription>
              Optional: enter exact share amounts (EGP). Blank splits the
              remaining amount equally.
            </FieldDescription>
          </FieldSet>

          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending ? "Creating..." : "Create Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
