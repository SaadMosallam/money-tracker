"use client";

import { useRef, useState, useTransition } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils/userInitials";
import { upload } from "@vercel/blob/client";
import { X } from "lucide-react";
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
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  action: (formData: FormData) => Promise<{
    name: string;
    passwordChanged: boolean;
  }>;
  setAvatarAction: (avatarUrl: string) => Promise<{ avatarUrl: string | null }>;
  deleteAvatarAction: () => Promise<{ avatarUrl: null }>;
};

export function UserProfileForm({
  user,
  action,
  setAvatarAction,
  deleteAvatarAction,
}: UserProfileFormProps) {
  const { update } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAvatarPending, setIsAvatarPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? null);
  const avatarFormRef = useRef<HTMLFormElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarAbortRef = useRef<AbortController | null>(null);
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const initials = getUserInitials(name || user.email);

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
        router.push("/");
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
        <div className="space-y-6">
          <form ref={avatarFormRef} className="space-y-4">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Avatar</FieldLabel>
                  <FieldContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={name} />
                        ) : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <Input
                        ref={avatarInputRef}
                        name="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setAvatarError(null);
                          setIsAvatarPending(true);
                          setUploadProgress(0);
                          const controller = new AbortController();
                          avatarAbortRef.current = controller;
                          try {
                            const blob = await upload(
                              `avatars/${user.id}/${file.name}`,
                              file,
                              {
                                access: "public",
                                handleUploadUrl: "/api/avatar/upload",
                                abortSignal: controller.signal,
                                onUploadProgress: (progress) => {
                                  if (progress.total > 0) {
                                    const percent = Math.round(
                                      (progress.loaded / progress.total) * 100
                                    );
                                    setUploadProgress(percent);
                                  }
                                },
                              }
                            );

                            const result = await setAvatarAction(blob.url);
                            setAvatarUrl(result.avatarUrl ?? null);
                            if (update) {
                              await update({ image: result.avatarUrl ?? null });
                            }
                            toast.success("Avatar updated.");
                          } catch (error: unknown) {
                            const message =
                              error instanceof Error ? error.message : "";
                            if (message.toLowerCase().includes("aborted")) {
                              toast.message("Upload canceled.");
                            } else if (isNextRedirect(error)) {
                              toast.success("Avatar updated.");
                              return;
                            } else {
                              console.error(error);
                              setAvatarError("Could not update avatar. Please try again.");
                              toast.error("Could not update avatar. Please try again.");
                            }
                          } finally {
                            setIsAvatarPending(false);
                            setUploadProgress(null);
                            avatarAbortRef.current = null;
                            if (avatarInputRef.current) {
                              avatarInputRef.current.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </FieldContent>
                  <FieldDescription>
                    Upload a square image up to 4MB. Leave empty to keep current.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={isAvatarPending}
                  onClick={() => {
                    setAvatarError(null);
                    avatarInputRef.current?.click();
                  }}
                  className="cursor-pointer"
                >
                  {isAvatarPending ? "Uploading..." : "Upload Avatar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAvatarError(null);
                    setIsAvatarPending(true);
                    (async () => {
                      try {
                        const result = await deleteAvatarAction();
                        setAvatarUrl(result.avatarUrl);
                        if (update) {
                          await update({ image: null });
                        }
                        toast.success("Avatar removed.");
                      } catch (error) {
                        if (isNextRedirect(error)) {
                          toast.success("Avatar removed.");
                          return;
                        }
                        console.error(error);
                        setAvatarError("Could not remove avatar. Please try again.");
                        toast.error("Could not remove avatar. Please try again.");
                      } finally {
                        setIsAvatarPending(false);
                      }
                    })();
                  }}
                  disabled={isAvatarPending || !avatarUrl}
                  className="cursor-pointer"
                >
                  Remove Avatar
                </Button>
              </div>
              {uploadProgress !== null && (
                <div className="flex items-center gap-2">
                  <progress
                    className="h-2 w-full overflow-hidden rounded-full"
                    value={uploadProgress}
                    max={100}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      avatarAbortRef.current?.abort();
                    }}
                    disabled={!avatarAbortRef.current}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {avatarError && <FieldError>{avatarError}</FieldError>}
            </FieldSet>
          </form>

          <div className="space-y-4">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <FieldContent>
                    <Input
                      name="name"
                      value={name}
                      readOnly
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="name" value={name} />
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

            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? "Saving..." : "Update Password"}
            </Button>

            {errorMessage && <FieldError>{errorMessage}</FieldError>}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
