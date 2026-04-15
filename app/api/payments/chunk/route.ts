import { NextRequest, NextResponse } from "next/server";
import { PAYMENTS_PAGE_SIZE, getPaymentFeedChunk } from "@/lib/server/paymentsFeed";

export async function GET(request: NextRequest) {
  const offsetParam = request.nextUrl.searchParams.get("offset");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const parsedOffset = Number.parseInt(offsetParam ?? "0", 10);
  const parsedLimit = Number.parseInt(limitParam ?? `${PAYMENTS_PAGE_SIZE}`, 10);

  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : PAYMENTS_PAGE_SIZE;

  const { rows, hasMore } = await getPaymentFeedChunk({ offset, limit });
  return NextResponse.json({ rows, hasMore });
}
