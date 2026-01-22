"use server";

import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { validatePaymentRows } from "@/lib/validation/rows";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function createPayment(formData: FormData): Promise<void> {
  const fromUserId = String(formData.get("fromUserId"));
  const toUserId = String(formData.get("toUserId"));
  const amount = Number(formData.get("amount"));

  // ---------- 1️⃣ Basic domain validation ----------
  if (!fromUserId || !toUserId) {
    throw new Error("fromUserId and toUserId are required");
  }

  if (fromUserId === toUserId) {
    throw new Error("fromUserId and toUserId must be different");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer (cents)");
  }

  const paymentRow = {
    id: randomUUID(),
    fromUserId,
    toUserId,
    amount,
  };

  // ---------- 2️⃣ Row-level validation ----------
  const validation = validatePaymentRows([paymentRow]);
  if (!validation.ok) {
    throw new Error(validation.errors.join(", "));
  }
  // ---------- 3️⃣ Insert ----------
  await db.insert(payments).values(paymentRow);

  // ---------- 4️⃣ Revalidate ----------
  revalidatePath("/dashboard");
}
