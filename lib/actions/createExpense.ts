"use server";

import { db } from "@/lib/db";
import { expenses, expenseParticipants } from "@/lib/db/schema";
import { validateExpenseRows, validateExpenseParticipantRows } from "@/lib/validation/rows";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function createExpense(formData: FormData) {
  const title = String(formData.get("title"));
  const amount = Number(formData.get("amount"));
  const paidById = String(formData.get("paidById"));
  const participants = JSON.parse(
    String(formData.get("participants"))
  ) as { userId: string; weight: number }[];


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
  });

  // ---------- 5️⃣ Revalidate dashboard ----------
  revalidatePath("/");
  revalidatePath("/expenses");
}
