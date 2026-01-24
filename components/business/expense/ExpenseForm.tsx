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
    weight: number;
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
      initial[user.id] = { selected: true, weight: 1 };
    }
    return initial;
  });

  const hasUsers = users.length > 0;
  const participantsPayload = useMemo(() => {
    return Object.entries(participants)
      .filter(([, value]) => value.selected)
      .map(([userId, value]) => ({
        userId,
        weight: value.weight,
      }));
  }, [participants]);

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
          <input
            type="hidden"
            name="amount"
            value={amount ? String(Number(amount) * 100) : ""}
          />

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
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="10000"
                  value={amount}
                  onChange={(event) => {
                    const raw = event.target.value;
                    const sanitized = raw.replace(/[^\d]/g, "");
                    setAmount(sanitized);
                  }}
                  required
                />
              </FieldContent>
              <FieldDescription>Whole EGP only (no decimals).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Paid By</FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline">
                      {paidByLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
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
            <FieldGroup>
              {users.map((user) => {
                const state = participants[user.id];
                return (
                  <Field key={user.id} orientation="horizontal">
                    <FieldLabel>
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
                              weight: prev[user.id]?.weight ?? 1,
                            },
                          }));
                        }}
                        id={`participant-${user.id}`}
                      />
                      <span>{user.name}</span>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-24"
                        value={state?.weight ?? 1}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const parsed = Number.parseInt(raw, 10);
                          const weight =
                            Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
                          setParticipants((prev) => ({
                            ...prev,
                            [user.id]: {
                              selected: prev[user.id]?.selected ?? false,
                              weight,
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
              Uncheck users to exclude them. Weights are integer shares.
            </FieldDescription>
          </FieldSet>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
