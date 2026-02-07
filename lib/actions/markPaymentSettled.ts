"use server";

import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markPaymentSettled(formData: FormData): Promise<void> {
  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) return;

  await db.update(payments).set({ isSettled: true }).where(eq(payments.id, paymentId));

  revalidatePath("/", "layout");
}
