"use server";

import { db } from "@/lib/db";
import {
  approvalNotifications,
  expenseApprovals,
  expenseParticipants,
  expenses,
} from "@/lib/db/schema";
import {
  validateExpenseRows,
  validateExpenseParticipantRows,
} from "@/lib/validation/rows";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createExpense(formData: FormData) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new Error("You must be signed in to create expenses.");
  }

  const title = String(formData.get("title"));
  const amount = Number(formData.get("amount"));
  const paidById = sessionUserId;
  const locale = String(formData.get("locale") ?? "en") || "en";
  const participants = JSON.parse(String(formData.get("participants"))) as {
    userId: string;
    weight: number;
  }[];

  // ---------- 1️⃣ Basic domain validation ----------
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer (cents)");
  }

  if (participants.length === 0) {
    throw new Error("expense must have at least one participant");
  }

  if (!title || title.trim().length === 0) {
    throw new Error("title is required");
  }

  const expenseId = randomUUID();

  // ---------- 2️⃣ Prepare rows ----------
  const expenseRow = {
    title,
    id: expenseId,
    amount,
    paidById,
    isSettled: false,
    createdAt: new Date(),
  };

  const participantRows = participants.map((p) => ({
    expenseId,
    userId: p.userId,
    weight: p.weight,
  }));

  const approverIds = Array.from(
    new Set(participantRows.map((p) => p.userId))
  ).filter((userId) => userId !== paidById);

  const approvalRows = approverIds.map((userId) => ({
    expenseId,
    userId,
    status: "pending",
    decidedAt: null,
  }));

  const notificationRows = approverIds.map((userId) => ({
    userId,
    entityType: "expense",
    entityId: expenseId,
    resolvedAt: null,
  }));

  // ---------- 3️⃣ Row-level validation (reuse your existing validators) ----------
  const expenseValidation = validateExpenseRows([expenseRow]);
  if (!expenseValidation.ok) {
    throw new Error(expenseValidation.errors.join(", "));
  }

  const participantValidation = validateExpenseParticipantRows(participantRows);
  if (!participantValidation.ok) {
    throw new Error(participantValidation.errors.join(", "));
  }

  // ---------- 4️⃣ Atomic insert ----------
  await db.transaction(async (tx) => {
    await tx.insert(expenses).values(expenseRow);
    await tx.insert(expenseParticipants).values(participantRows);
    if (approvalRows.length > 0) {
      await tx.insert(expenseApprovals).values(approvalRows);
    }
    if (notificationRows.length > 0) {
      await tx
        .insert(approvalNotifications)
        .values(notificationRows)
        .onConflictDoNothing();
    }
  });

  // ---------- 5️⃣ Revalidate dashboard ----------
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/expenses`);
  revalidatePath(`/${locale}/approvals`);
  redirect(`/${locale}`);
}
