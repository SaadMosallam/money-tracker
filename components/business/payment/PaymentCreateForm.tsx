"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type UserOption = {
  id: string;
  name: string;
};

type PaymentCreateFormProps = {
  users: UserOption[];
  action: (formData: FormData) => void;
};

export function PaymentCreateForm({ users, action }: PaymentCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [fromUserId, setFromUserId] = useState(users[0]?.id ?? "");
  const [toUserId, setToUserId] = useState(users[1]?.id ?? users[0]?.id ?? "");

  const hasUsers = users.length > 0;
  const getAlternateUserId = (excludeId: string) =>
    users.find((user) => user.id !== excludeId)?.id ?? "";

  const fromUserLabel = useMemo(() => {
    return users.find((user) => user.id === fromUserId)?.name ?? "Select user";
  }, [users, fromUserId]);

  const toUserLabel = useMemo(() => {
    return users.find((user) => user.id === toUserId)?.name ?? "Select user";
  }, [users, toUserId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        if (!fromUserId || !toUserId || fromUserId === toUserId) {
          toast.error("Please select two different users.");
          return;
        }
        await action(formData);
        toast.success("Payment added successfully.");
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
          <CardTitle>New Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add users first before creating payments.
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
          <input type="hidden" name="fromUserId" value={fromUserId} />
          <input type="hidden" name="toUserId" value={toUserId} />
          <input
            type="hidden"
            name="amount"
            value={amount ? String(Number(amount) * 100) : ""}
          />

          <FieldGroup>
            <Field>
              <FieldLabel>From</FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline">
                      {fromUserLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={fromUserId}
                      onValueChange={(value) => {
                        setFromUserId(value);
                        if (value === toUserId) {
                          setToUserId(getAlternateUserId(value));
                        }
                      }}
                    >
                      {users.map((user) => (
                        <DropdownMenuRadioItem
                          key={user.id}
                          value={user.id}
                          disabled={user.id === toUserId}
                        >
                          {user.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldContent>
              <FieldDescription>Who paid the money.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>To</FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline">
                      {toUserLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={toUserId}
                      onValueChange={(value) => {
                        setToUserId(value);
                        if (value === fromUserId) {
                          setFromUserId(getAlternateUserId(value));
                        }
                      }}
                    >
                      {users.map((user) => (
                        <DropdownMenuRadioItem
                          key={user.id}
                          value={user.id}
                          disabled={user.id === fromUserId}
                        >
                          {user.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldContent>
              <FieldDescription>Who received the money.</FieldDescription>
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
                  placeholder="100"
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
          </FieldGroup>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
