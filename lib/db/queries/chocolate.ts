import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  chocolateBars,
  chocolateBarParticipants,
  chocolateBarApprovals,
  chocolatePieces,
  chocolateBarSettlements,
  approvalNotifications,
  users,
} from "@/lib/db/schema";
import { computeApprovalStatus } from "@/lib/utils/approvalStatus";
import { calculateChocolateBalances } from "@/lib/calculations/calculateChocolateBalances";
import type { BalanceByUserId } from "@/lib/types/expensesTypes";

export type ChocolateApprovalStatus = "pending" | "approved" | "rejected";
export type ChocolateBarStatus = "pending_approval" | "active" | "settled";

export type ChocolateBarRow = {
  id: string;
  title: string;
  cost: number;
  buyerId: string;
  width: number;
  height: number;
  area: number;
  createdAt: Date;
  settledAt: Date | null;
  participantIds: string[];
  approvals: { userId: string; status: string; decidedAt: Date | null }[];
  eatenByUser: Record<string, number>;
  totalEaten: number;
  settledByUserIds: string[];
  approvalStatus: ChocolateApprovalStatus;
  status: ChocolateBarStatus;
};

export const getChocolateBars = async (): Promise<ChocolateBarRow[]> => {
  const [bars, participants, approvals, pieces, settlements] = await Promise.all([
    db.select().from(chocolateBars).orderBy(desc(chocolateBars.createdAt)),
    db.select().from(chocolateBarParticipants),
    db.select().from(chocolateBarApprovals),
    db.select({
      barId: chocolatePieces.barId,
      userId: chocolatePieces.userId,
      totalArea: sql<number>`sum(${chocolatePieces.area})::int`,
    }).from(chocolatePieces).groupBy(chocolatePieces.barId, chocolatePieces.userId),
    db.select().from(chocolateBarSettlements),
  ]);

  const participantsByBar = new Map<string, string[]>();
  for (const p of participants) {
    const list = participantsByBar.get(p.barId) ?? [];
    list.push(p.userId);
    participantsByBar.set(p.barId, list);
  }

  const approvalsByBar = new Map<string, typeof approvals>();
  for (const a of approvals) {
    const list = approvalsByBar.get(a.barId) ?? [];
    list.push(a);
    approvalsByBar.set(a.barId, list);
  }

  const eatenByBar = new Map<string, Record<string, number>>();
  for (const p of pieces) {
    const map = eatenByBar.get(p.barId) ?? {};
    map[p.userId] = (map[p.userId] ?? 0) + (p.totalArea ?? 0);
    eatenByBar.set(p.barId, map);
  }

  const settledByBar = new Map<string, string[]>();
  for (const s of settlements) {
    const list = settledByBar.get(s.barId) ?? [];
    list.push(s.userId);
    settledByBar.set(s.barId, list);
  }

  return bars.map((bar) => {
    const barApprovals = approvalsByBar.get(bar.id) ?? [];
    const eatenByUser = eatenByBar.get(bar.id) ?? {};
    const totalEaten = Object.values(eatenByUser).reduce((s, v) => s + v, 0);
    const approvalStatus = computeApprovalStatus(barApprovals);
    const settledByUserIds = settledByBar.get(bar.id) ?? [];

    let status: ChocolateBarStatus;
    if (bar.settledAt !== null) {
      status = "settled";
    } else if (approvalStatus === "approved") {
      status = "active";
    } else {
      status = "pending_approval";
    }

    return {
      id: bar.id,
      title: bar.title,
      cost: bar.cost,
      buyerId: bar.buyerId,
      width: bar.width,
      height: bar.height,
      area: bar.area,
      createdAt: bar.createdAt,
      settledAt: bar.settledAt ?? null,
      participantIds: participantsByBar.get(bar.id) ?? [],
      approvals: barApprovals,
      eatenByUser,
      totalEaten,
      settledByUserIds,
      approvalStatus,
      status,
    };
  });
};

export const getChocolateBarById = async (id: string): Promise<ChocolateBarRow | null> => {
  const bars = await getChocolateBars();
  return bars.find((b) => b.id === id) ?? null;
};

export const getChocolatePiecesByBar = async (barId: string) => {
  return db
    .select()
    .from(chocolatePieces)
    .where(eq(chocolatePieces.barId, barId))
    .orderBy(desc(chocolatePieces.createdAt));
};

export const getPendingChocolateApprovalsForUser = async (userId: string) => {
  const notifications = await db
    .select()
    .from(approvalNotifications)
    .where(
      and(
        eq(approvalNotifications.userId, userId),
        eq(approvalNotifications.entityType, "chocolate"),
        isNull(approvalNotifications.resolvedAt),
      ),
    );

  if (notifications.length === 0) return [];

  const barIds = notifications.map((n) => n.entityId);
  const [bars, participants, approvals] = await Promise.all([
    db.select().from(chocolateBars).where(inArray(chocolateBars.id, barIds)),
    db.select().from(chocolateBarParticipants).where(inArray(chocolateBarParticipants.barId, barIds)),
    db.select().from(chocolateBarApprovals).where(inArray(chocolateBarApprovals.barId, barIds)),
  ]);

  return bars
    .map((bar) => {
      const barApprovals = approvals.filter((a) => a.barId === bar.id);
      const userApproval = barApprovals.find((a) => a.userId === userId);
      if (!userApproval || userApproval.status !== "pending") return null;
      const participantIds = participants.filter((p) => p.barId === bar.id).map((p) => p.userId);
      const approvalStatus = computeApprovalStatus(barApprovals);
      return {
        id: bar.id,
        title: bar.title,
        cost: bar.cost,
        buyerId: bar.buyerId,
        createdAt: bar.createdAt,
        participantIds,
        approvalStatus,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    cost: number;
    buyerId: string;
    createdAt: Date;
    participantIds: string[];
    approvalStatus: ChocolateApprovalStatus;
  }>;
};

export const getChocolateBalances = async (): Promise<BalanceByUserId> => {
  const [allUsers, settledBars, participants, pieces] = await Promise.all([
    db.select({ id: users.id }).from(users),
    db.select().from(chocolateBars).where(isNotNull(chocolateBars.settledAt)),
    db.select().from(chocolateBarParticipants),
    db.select({
      barId: chocolatePieces.barId,
      userId: chocolatePieces.userId,
      totalArea: sql<number>`sum(${chocolatePieces.area})::int`,
    }).from(chocolatePieces).groupBy(chocolatePieces.barId, chocolatePieces.userId),
  ]);

  const userIds = allUsers.map((u) => u.id);

  const participantsByBar = new Map<string, string[]>();
  for (const p of participants) {
    const list = participantsByBar.get(p.barId) ?? [];
    list.push(p.userId);
    participantsByBar.set(p.barId, list);
  }

  const eatenByBar = new Map<string, Record<string, number>>();
  for (const p of pieces) {
    const map = eatenByBar.get(p.barId) ?? {};
    map[p.userId] = (map[p.userId] ?? 0) + (p.totalArea ?? 0);
    eatenByBar.set(p.barId, map);
  }

  const bars = settledBars.map((bar) => ({
    id: bar.id,
    cost: bar.cost,
    area: bar.area,
    buyerId: bar.buyerId,
    participantIds: participantsByBar.get(bar.id) ?? [],
    eatenByUser: eatenByBar.get(bar.id) ?? {},
  }));

  return calculateChocolateBalances({ userIds, bars });
};
