"use server";

import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markSettled(formData: FormData): Promise<void> {
  const expenseId = String(formData.get("expenseId"));

  if (!expenseId) {
    throw new Error("expenseId is required");
  }

  await db
    .update(expenses)
    .set({ isSettled: true })
    .where(eq(expenses.id, expenseId));

  revalidatePath("/");
  revalidatePath("/expenses");
}
