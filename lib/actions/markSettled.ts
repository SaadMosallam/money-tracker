"use server";

import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";

export async function markSettled(formData: FormData): Promise<void> {
  const expenseId = String(formData.get("expenseId"));

  if (!expenseId) {
    throw new Error("expenseId is required");
  }

  await db
    .update(expenses)
    .set({ isSettled: true })
    .where(eq(expenses.id, expenseId));

  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/expenses`);
  }
}
