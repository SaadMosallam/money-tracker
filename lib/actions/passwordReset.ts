"use server";

import { randomBytes, createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email/sendReset";
import { hashPassword } from "@/lib/auth/password";
import { isValidEmail } from "@/lib/validation/email";
import { revalidatePath } from "next/cache";

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Always return a generic response to avoid user enumeration
  if (!email || !isValidEmail(email)) {
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  await sendPasswordResetEmail(user.email, {
    recipientName: user.name ?? user.email,
    token,
  });
}

export async function resetPassword(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token || newPassword.length < 8) {
    throw new Error("Invalid reset request.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  if (!row) {
    throw new Error("Reset link is invalid or expired.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.id, row.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id));
  });

  revalidatePath("/login");
}
