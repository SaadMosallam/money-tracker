"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";
import { isValidEmail } from "@/lib/validation/email";

export async function updateUserInfo(formData: FormData) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new Error("You must be signed in to update your profile.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name) {
    throw new Error("Name is required.");
  }

  if (!email || !isValidEmail(email)) {
    throw new Error("Email is invalid.");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1);

  if (!user) {
    throw new Error("User not found.");
  }

  const updates: Partial<typeof users.$inferInsert> = { name, email };

  const [emailExists] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, sessionUserId)))
    .limit(1);
  if (emailExists) {
    throw new Error("Email is already in use.");
  }

  await db.update(users).set(updates).where(eq(users.id, sessionUserId));

  revalidatePath("/account");
  revalidatePath("/");

  return { name, email };
}

export async function updateUserPassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new Error("You must be signed in to update your profile.");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!newPassword) {
    throw new Error("New password is required.");
  }
  if (!currentPassword) {
    throw new Error("Current password is required to change your password.");
  }
  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new Error("Current password is incorrect.");
  }
  if (verifyPassword(newPassword, user.passwordHash)) {
    throw new Error("New password must be different from your current password.");
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(users.id, sessionUserId));

  revalidatePath("/account");
  revalidatePath("/");

  return { passwordChanged: true };
}
