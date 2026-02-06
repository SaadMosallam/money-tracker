import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvalNotifications } from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(approvalNotifications)
    .where(
      and(
        eq(approvalNotifications.userId, session.user.id),
        isNull(approvalNotifications.resolvedAt)
      )
    );

  return NextResponse.json({ count: row?.count ?? 0 });
}
