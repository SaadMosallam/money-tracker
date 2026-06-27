"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  approvalNotifications,
  chocolateBarApprovals,
  chocolateBarParticipants,
  chocolateBars,
  chocolateBarSettlements,
  chocolatePieces,
} from "@/lib/db/schema";
import { locales } from "@/lib/i18n";
import { parseCurrencyToCents } from "@/lib/utils/currency";

const revalidateChocolate = () => {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/chocolate`);
    revalidatePath(`/${locale}/account`);
  }
};

export async function createChocolateBar(formData: FormData) {
  const session = await getServerSession(authOptions);
  const buyerId = session?.user?.id;
  if (!buyerId) throw new Error("You must be signed in.");

  const title = String(formData.get("title") ?? "").trim();
  const costRaw = String(formData.get("cost") ?? "");
  const widthRaw = String(formData.get("width") ?? "");
  const heightRaw = String(formData.get("height") ?? "");
  const participantIdsRaw = String(formData.get("participantIds") ?? "[]");

  if (!title) throw new Error("Title is required.");

  const cost = parseCurrencyToCents(costRaw);
  if (!cost || cost <= 0) throw new Error("Cost must be a positive amount.");

  const width = parseCurrencyToCents(widthRaw);
  if (!width || width <= 0) throw new Error("Width must be a positive number.");

  const height = parseCurrencyToCents(heightRaw);
  if (!height || height <= 0) throw new Error("Height must be a positive number.");

  const area = width * height;

  let participantIds: string[] = JSON.parse(participantIdsRaw);
  participantIds = Array.from(new Set([buyerId, ...participantIds]));
  if (participantIds.length < 1) throw new Error("At least one participant is required.");

  const barId = randomUUID();
  const approverIds = participantIds.filter((id) => id !== buyerId);

  await db.transaction(async (tx) => {
    await tx.insert(chocolateBars).values({
      id: barId,
      title,
      cost,
      buyerId,
      width,
      height,
      area,
      createdAt: new Date(),
    });

    await tx.insert(chocolateBarParticipants).values(
      participantIds.map((userId) => ({ barId, userId })),
    );

    if (approverIds.length > 0) {
      await tx.insert(chocolateBarApprovals).values(
        approverIds.map((userId) => ({
          barId,
          userId,
          status: "pending",
          decidedAt: null,
        })),
      );

      await tx
        .insert(approvalNotifications)
        .values(
          approverIds.map((userId) => ({
            userId,
            entityType: "chocolate",
            entityId: barId,
            resolvedAt: null,
          })),
        )
        .onConflictDoNothing();
    }
  });

  revalidateChocolate();
}

export async function approveChocolateBar(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const barId = String(formData.get("barId") ?? "");
  if (!barId) throw new Error("barId is required.");

  const [row] = await db
    .select()
    .from(chocolateBarApprovals)
    .where(and(eq(chocolateBarApprovals.barId, barId), eq(chocolateBarApprovals.userId, userId)))
    .limit(1);

  if (!row) throw new Error("Approval not found.");
  if (row.status !== "pending") throw new Error("Approval already decided.");

  await db
    .update(chocolateBarApprovals)
    .set({ status: "approved", decidedAt: new Date() })
    .where(and(eq(chocolateBarApprovals.barId, barId), eq(chocolateBarApprovals.userId, userId)));

  await db
    .update(approvalNotifications)
    .set({ resolvedAt: new Date() })
    .where(
      and(
        eq(approvalNotifications.userId, userId),
        eq(approvalNotifications.entityType, "chocolate"),
        eq(approvalNotifications.entityId, barId),
        isNull(approvalNotifications.resolvedAt),
      ),
    );

  revalidateChocolate();
}

export async function rejectChocolateBar(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const barId = String(formData.get("barId") ?? "");
  if (!barId) throw new Error("barId is required.");

  const [row] = await db
    .select()
    .from(chocolateBarApprovals)
    .where(and(eq(chocolateBarApprovals.barId, barId), eq(chocolateBarApprovals.userId, userId)))
    .limit(1);

  if (!row) throw new Error("Approval not found.");
  if (row.status !== "pending") throw new Error("Approval already decided.");

  await db
    .update(chocolateBarApprovals)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(and(eq(chocolateBarApprovals.barId, barId), eq(chocolateBarApprovals.userId, userId)));

  await db
    .update(approvalNotifications)
    .set({ resolvedAt: new Date() })
    .where(
      and(
        eq(approvalNotifications.userId, userId),
        eq(approvalNotifications.entityType, "chocolate"),
        eq(approvalNotifications.entityId, barId),
        isNull(approvalNotifications.resolvedAt),
      ),
    );

  revalidateChocolate();
}

export async function logChocolatePiece(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const barId = String(formData.get("barId") ?? "");
  const widthRaw = String(formData.get("width") ?? "");
  const heightRaw = String(formData.get("height") ?? "");
  if (!barId) throw new Error("barId is required.");

  const width = parseCurrencyToCents(widthRaw);
  if (!width || width <= 0) throw new Error("Width must be a positive number.");

  const height = parseCurrencyToCents(heightRaw);
  if (!height || height <= 0) throw new Error("Height must be a positive number.");

  const area = width * height;

  // Load bar + participants + approvals + existing pieces in parallel
  const [barRows, participantRows, approvalRows, pieceRows] = await Promise.all([
    db.select().from(chocolateBars).where(eq(chocolateBars.id, barId)).limit(1),
    db.select().from(chocolateBarParticipants).where(eq(chocolateBarParticipants.barId, barId)),
    db.select().from(chocolateBarApprovals).where(eq(chocolateBarApprovals.barId, barId)),
    db.select().from(chocolatePieces).where(eq(chocolatePieces.barId, barId)),
  ]);

  const bar = barRows[0];
  if (!bar) throw new Error("Bar not found.");
  if (bar.settledAt !== null) throw new Error("Bar is already settled.");

  const isParticipant = participantRows.some((p) => p.userId === userId);
  if (!isParticipant) throw new Error("You are not a participant of this bar.");

  const allApproved = approvalRows.length === 0
    ? true
    : approvalRows.every((a) => a.status === "approved");
  if (!allApproved) throw new Error("Bar is not fully approved yet.");

  const totalEaten = pieceRows.reduce((s, p) => s + p.area, 0);
  if (totalEaten + area > bar.area) throw new Error("Piece exceeds remaining area.");

  await db.transaction(async (tx) => {
    await tx.insert(chocolatePieces).values({
      id: randomUUID(),
      barId,
      userId,
      width,
      height,
      area,
      createdAt: new Date(),
    });
    // Reset all settlement marks
    await tx.delete(chocolateBarSettlements).where(eq(chocolateBarSettlements.barId, barId));
  });

  revalidateChocolate();
}

export async function settleChocolateBar(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const barId = String(formData.get("barId") ?? "");
  if (!barId) throw new Error("barId is required.");

  const [barRows, participantRows] = await Promise.all([
    db.select().from(chocolateBars).where(eq(chocolateBars.id, barId)).limit(1),
    db.select().from(chocolateBarParticipants).where(eq(chocolateBarParticipants.barId, barId)),
  ]);

  const bar = barRows[0];
  if (!bar) throw new Error("Bar not found.");
  if (bar.settledAt !== null) throw new Error("Bar is already fully settled.");

  const isParticipant = participantRows.some((p) => p.userId === userId);
  if (!isParticipant) throw new Error("You are not a participant of this bar.");

  await db
    .insert(chocolateBarSettlements)
    .values({ barId, userId, settledAt: new Date() })
    .onConflictDoNothing();

  const [settlementCountRow] = await db
    .select({ cnt: count() })
    .from(chocolateBarSettlements)
    .where(eq(chocolateBarSettlements.barId, barId));

  if ((settlementCountRow?.cnt ?? 0) >= participantRows.length) {
    await db
      .update(chocolateBars)
      .set({ settledAt: new Date() })
      .where(eq(chocolateBars.id, barId));
  }

  revalidateChocolate();
}

export async function unsettleChocolateBar(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");

  const barId = String(formData.get("barId") ?? "");
  if (!barId) throw new Error("barId is required.");

  const [bar] = await db.select().from(chocolateBars).where(eq(chocolateBars.id, barId)).limit(1);
  if (!bar) throw new Error("Bar not found.");
  if (bar.settledAt !== null) throw new Error("Bar is fully settled and cannot be changed.");

  await db
    .delete(chocolateBarSettlements)
    .where(
      and(eq(chocolateBarSettlements.barId, barId), eq(chocolateBarSettlements.userId, userId)),
    );

  revalidateChocolate();
}
