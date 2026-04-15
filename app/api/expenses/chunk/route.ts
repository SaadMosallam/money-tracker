import { NextRequest, NextResponse } from "next/server";
import { EXPENSES_PAGE_SIZE, getExpenseFeedChunk } from "@/lib/server/expensesFeed";

export async function GET(request: NextRequest) {
  const offsetParam = request.nextUrl.searchParams.get("offset");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const parsedOffset = Number.parseInt(offsetParam ?? "0", 10);
  const parsedLimit = Number.parseInt(limitParam ?? `${EXPENSES_PAGE_SIZE}`, 10);

  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : EXPENSES_PAGE_SIZE;

  const { rows, hasMore } = await getExpenseFeedChunk({ offset, limit });
  return NextResponse.json({ rows, hasMore });
}
