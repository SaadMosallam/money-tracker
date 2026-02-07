"use server";

import { and, eq, isNull } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  approvalNotifications,
  expenseApprovals,
  paymentApprovals,
} from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";

const resolveNotification = async (
  userId: string,
  entityType: "expense" | "payment",
  entityId: string
) => {
  await db
    .update(approvalNotifications)
    .set({ resolvedAt: new Date() })
    .where(
      and(
        eq(approvalNotifications.userId, userId),
        eq(approvalNotifications.entityType, entityType),
        eq(approvalNotifications.entityId, entityId),
        isNull(approvalNotifications.resolvedAt)
      )
    );
};

export async function approveExpense(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const expenseId = String(formData.get("expenseId") ?? "");
  if (!expenseId) throw new Error("expenseId is required.");

  const [row] = await db
    .select()
    .from(expenseApprovals)
    .where(and(eq(expenseApprovals.expenseId, expenseId), eq(expenseApprovals.userId, userId)))
    .limit(1);

  if (!row) throw new Error("Approval not found.");
  if (row.status !== "pending") throw new Error("Approval already decided.");

  await db
    .update(expenseApprovals)
    .set({ status: "approved", decidedAt: new Date() })
    .where(and(eq(expenseApprovals.expenseId, expenseId), eq(expenseApprovals.userId, userId)));

  await resolveNotification(userId, "expense", expenseId);

  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/expenses`);
    revalidatePath(`/${locale}/approvals`);
    revalidatePath(`/${locale}/account`);
  }
}

export async function rejectExpense(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const expenseId = String(formData.get("expenseId") ?? "");
  if (!expenseId) throw new Error("expenseId is required.");

  const [row] = await db
    .select()
    .from(expenseApprovals)
    .where(and(eq(expenseApprovals.expenseId, expenseId), eq(expenseApprovals.userId, userId)))
    .limit(1);

  if (!row) throw new Error("Approval not found.");
  if (row.status !== "pending") throw new Error("Approval already decided.");

  await db
    .update(expenseApprovals)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(and(eq(expenseApprovals.expenseId, expenseId), eq(expenseApprovals.userId, userId)));

  await resolveNotification(userId, "expense", expenseId);

  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/expenses`);
    revalidatePath(`/${locale}/approvals`);
    revalidatePath(`/${locale}/account`);
  }
}

export async function approvePayment(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) throw new Error("paymentId is required.");

  const [row] = await db
    .select()
    .from(paymentApprovals)
    .where(and(eq(paymentApprovals.paymentId, paymentId), eq(paymentApprovals.userId, userId)))
    .limit(1);

  if (!row) throw new Error("Approval not found.");
  if (row.status !== "pending") throw new Error("Approval already decided.");

  await db
    .update(paymentApprovals)
    .set({ status: "approved", decidedAt: new Date() })
    .where(and(eq(paymentApprovals.paymentId, paymentId), eq(paymentApprovals.userId, userId)));

  await resolveNotification(userId, "payment", paymentId);

  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/payments`);
    revalidatePath(`/${locale}/approvals`);
    revalidatePath(`/${locale}/account`);
  }
}

export async function rejectPayment(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) throw new Error("paymentId is required.");

  const [row] = await db
    .select()
    .from(paymentApprovals)
    .where(and(eq(paymentApprovals.paymentId, paymentId), eq(paymentApprovals.userId, userId)))
    .limit(1);

  if (!row) throw new Error("Approval not found.");
  if (row.status !== "pending") throw new Error("Approval already decided.");

  await db
    .update(paymentApprovals)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(and(eq(paymentApprovals.paymentId, paymentId), eq(paymentApprovals.userId, userId)));

  await resolveNotification(userId, "payment", paymentId);

  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/payments`);
    revalidatePath(`/${locale}/approvals`);
    revalidatePath(`/${locale}/account`);
  }
}
