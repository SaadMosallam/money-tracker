"use server";

import { db } from "@/lib/db";
import { approvalNotifications, paymentApprovals, payments, users } from "@/lib/db/schema";
import { validatePaymentRows } from "@/lib/validation/rows";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPendingApprovalEmail } from "@/lib/email/send";
import { inArray } from "drizzle-orm";

export async function createPayment(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new Error("You must be signed in to create payments.");
  }

  const fromUserId = sessionUserId;
  const toUserId = String(formData.get("toUserId"));
  const amount = Number(formData.get("amount"));
  const locale = String(formData.get("locale") ?? "en") || "en";

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
    createdAt: new Date(),
  };

  const approvalRows = [
    {
      paymentId: paymentRow.id,
      userId: toUserId,
      status: "pending",
      decidedAt: null,
    },
  ];

  const notificationRows = [
    {
      userId: toUserId,
      entityType: "payment",
      entityId: paymentRow.id,
      resolvedAt: null,
    },
  ];

  // ---------- 2️⃣ Row-level validation ----------
  const validation = validatePaymentRows([paymentRow]);
  if (!validation.ok) {
    throw new Error(validation.errors.join(", "));
  }
  // ---------- 3️⃣ Insert ----------
  await db.transaction(async (tx) => {
    await tx.insert(payments).values(paymentRow);
    await tx.insert(paymentApprovals).values(approvalRows);
    await tx
      .insert(approvalNotifications)
      .values(notificationRows)
      .onConflictDoNothing();
  });

  const [recipient] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.id, [toUserId]))
    .limit(1);

  if (recipient?.email) {
    await sendPendingApprovalEmail(recipient.email, {
      recipientName: recipient.name ?? recipient.email,
      entityType: "payment",
      amountCents: amount,
      fromName: session?.user?.name ?? session?.user?.email ?? "—",
      toName: recipient.name ?? recipient.email,
      locale,
    });
  }

  // ---------- 4️⃣ Revalidate ----------
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/payments`);
  revalidatePath(`/${locale}/approvals`);
  redirect(`/${locale}`);
}
