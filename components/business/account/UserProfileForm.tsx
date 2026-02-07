"use client";

import { useRef, useState, useTransition } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils/userInitials";
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
import { Dictionary } from "@/lib/i18n";

type UserProfileFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  locale: string;
  t: Dictionary;
  action: (formData: FormData) => Promise<{
    name: string;
    passwordChanged: boolean;
  }>;
  setAvatarAction: (avatarUrl: string) => Promise<{ avatarUrl: string | null }>;
  deleteAvatarAction: () => Promise<{ avatarUrl: null }>;
};

export function UserProfileForm({
  user,
  locale,
  t,
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
          nextErrors.name = t.nameRequired;
        }
        if (newPassword || confirmPassword) {
          if (!currentPassword) {
            nextErrors.currentPassword = t.currentPasswordRequired;
          }
          if (currentPassword && newPassword && currentPassword === newPassword) {
            nextErrors.newPassword = t.newPasswordDifferent;
          }
          if (newPassword.length < 8) {
            nextErrors.newPassword = t.newPasswordMin;
          }
          if (newPassword !== confirmPassword) {
            nextErrors.confirmPassword = t.passwordsDoNotMatch;
          }
        }
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          toast.error(t.fixHighlightedFields);
          return;
        }

        formData.set("name", name.trim());
        const result = await action(formData);

        if (result?.passwordChanged) {
          toast.success(t.passwordUpdatedSignInAgain);
          await signOut({ callbackUrl: `/${locale}/login` });
          return;
        }

        if (result?.name && update) {
          await update({ name: result.name });
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success(t.profileUpdated);
        router.push(`/${locale}`);
      } catch (error) {
        if (isNextRedirect(error)) {
          toast.success(t.profileUpdated);
          return;
        }
        console.error(error);
        setErrorMessage(t.somethingWentWrong);
        toast.error(t.somethingWentWrong);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.accountSettings}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form ref={avatarFormRef} className="space-y-4">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t.avatar}</FieldLabel>
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
                            const uploadResult = await new Promise<{ url: string }>(
                              (resolve, reject) => {
                                const xhr = new XMLHttpRequest();
                                xhr.open("POST", "/api/avatar/upload-file", true);
                                xhr.responseType = "json";

                                xhr.upload.onprogress = (progress) => {
                                  if (progress.lengthComputable) {
                                    const percent = Math.round(
                                      (progress.loaded / progress.total) * 100
                                    );
                                    // Keep some room for server-side processing.
                                    setUploadProgress(Math.min(percent, 95));
                                  }
                                };

                                xhr.onload = () => {
                                  if (xhr.status >= 200 && xhr.status < 300) {
                                    setUploadProgress(100);
                                    resolve(xhr.response as { url: string });
                                  } else {
                                    reject(
                                      new Error(
                                        (xhr.response as { error?: string })?.error ??
                                          t.somethingWentWrong
                                      )
                                    );
                                  }
                                };

                                xhr.onerror = () => reject(new Error(t.somethingWentWrong));
                                xhr.onabort = () => reject(new Error("aborted"));

                                const data = new FormData();
                                data.append("avatar", file);
                                xhr.send(data);

                                controller.signal.addEventListener("abort", () => {
                                  xhr.abort();
                                });
                              }
                            );

                            const result = await setAvatarAction(uploadResult.url);
                            setAvatarUrl(result.avatarUrl ?? null);
                            if (update) {
                              await update({ image: result.avatarUrl ?? null });
                            }
                            toast.success(t.avatarUpdated);
                          } catch (error: unknown) {
                            const message =
                              error instanceof Error ? error.message : "";
                            if (message.toLowerCase().includes("aborted")) {
                              toast.message(t.uploadCanceled);
                            } else if (isNextRedirect(error)) {
                              toast.success(t.avatarUpdated);
                              return;
                            } else {
                              console.error(error);
                              setAvatarError(t.couldNotUpdateAvatar);
                              toast.error(t.couldNotUpdateAvatar);
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
                    {t.uploadImageHelp}
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
                  {isAvatarPending ? t.uploading : t.uploadAvatar}
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
                        toast.success(t.avatarRemoved);
                      } catch (error) {
                        if (isNextRedirect(error)) {
                          toast.success(t.avatarRemoved);
                          return;
                        }
                        console.error(error);
                        setAvatarError(t.couldNotRemoveAvatar);
                        toast.error(t.couldNotRemoveAvatar);
                      } finally {
                        setIsAvatarPending(false);
                      }
                    })();
                  }}
                  disabled={isAvatarPending || !avatarUrl}
                  className="cursor-pointer"
                >
                  {t.removeAvatar}
                </Button>
              </div>
              {uploadProgress !== null && (
                <div className="flex items-center gap-2">
                  <progress
                    className="h-2 w-full overflow-hidden rounded-full"
                    value={uploadProgress ?? 0}
                    max={100}
                  />
                  <span className="text-xs text-muted-foreground">
                    {uploadProgress}%
                  </span>
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
                  <FieldLabel>{t.nameLabel}</FieldLabel>
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
                  <FieldLabel>{t.emailLabel}</FieldLabel>
                  <FieldContent>
                    <Input value={user.email} readOnly />
                  </FieldContent>
                  <FieldDescription>{t.emailCannotBeChanged}</FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="name" value={name} />
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t.currentPassword}</FieldLabel>
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
                  <FieldLabel>{t.newPassword}</FieldLabel>
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
                  <FieldLabel>{t.confirmNewPassword}</FieldLabel>
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
                {t.leavePasswordBlank}
              </FieldDescription>
            </FieldSet>

            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? t.saving : t.updatePassword}
            </Button>

            {errorMessage && <FieldError>{errorMessage}</FieldError>}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
