"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";
import { isValidEmail } from "@/lib/validation/email";

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new Error("You must be signed in to update your profile.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

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
  let passwordChanged = false;

  if (newPassword) {
    if (!currentPassword) {
      throw new Error("Current password is required to change your password.");
    }
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters.");
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error("Current password is incorrect.");
    }
    if (verifyPassword(newPassword, user.passwordHash)) {
      throw new Error("New password must be different from your current password.");
    }
    updates.passwordHash = hashPassword(newPassword);
    passwordChanged = true;
  }

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

  return { name, email, passwordChanged };
}
