"use client";

import { useState, useTransition } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isNextRedirect } from "@/lib/utils/isRedirectError";

type UserProfileFormProps = {
  user: {
    name: string;
    email: string;
  };
  action: (formData: FormData) => Promise<{
    name: string;
    passwordChanged: boolean;
  }>;
};

export function UserProfileForm({ user, action }: UserProfileFormProps) {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        setErrorMessage(null);
        setFieldErrors({});

        const nextErrors: typeof fieldErrors = {};
        if (!name.trim()) {
          nextErrors.name = "Name is required.";
        }
        if (newPassword || confirmPassword) {
          if (!currentPassword) {
            nextErrors.currentPassword = "Current password is required.";
          }
          if (currentPassword && newPassword && currentPassword === newPassword) {
            nextErrors.newPassword =
              "New password must be different from your current password.";
          }
          if (newPassword.length < 8) {
            nextErrors.newPassword = "New password must be at least 8 characters.";
          }
          if (newPassword !== confirmPassword) {
            nextErrors.confirmPassword = "Passwords do not match.";
          }
        }
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          toast.error("Please fix the highlighted fields.");
          return;
        }

        formData.set("name", name.trim());
        const result = await action(formData);

        if (result?.passwordChanged) {
          toast.success("Password updated. Please sign in again.");
          await signOut({ callbackUrl: "/login" });
          return;
        }

        if (result?.name && update) {
          await update({ name: result.name });
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Profile updated.");
      } catch (error) {
        if (isNextRedirect(error)) {
          toast.success("Profile updated.");
          return;
        }
        console.error(error);
        setErrorMessage("Something went wrong. Please try again.");
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Input
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={
                      fieldErrors.name
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                </FieldContent>
                {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input value={user.email} readOnly />
                </FieldContent>
                <FieldDescription>Email cannot be changed.</FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>Current Password</FieldLabel>
                <FieldContent>
                  <Input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className={
                      fieldErrors.currentPassword
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                </FieldContent>
                {fieldErrors.currentPassword && (
                  <FieldError>{fieldErrors.currentPassword}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>New Password</FieldLabel>
                <FieldContent>
                  <Input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className={
                      fieldErrors.newPassword
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                </FieldContent>
                {fieldErrors.newPassword && (
                  <FieldError>{fieldErrors.newPassword}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Confirm New Password</FieldLabel>
                <FieldContent>
                  <Input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={
                      fieldErrors.confirmPassword
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                </FieldContent>
                {fieldErrors.confirmPassword && (
                  <FieldError>{fieldErrors.confirmPassword}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <FieldDescription>
              Leave password fields blank to keep your current password.
            </FieldDescription>
          </FieldSet>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}
        </form>
      </CardContent>
    </Card>
  );
}
