"use client";

import { useMemo, useState } from "react";
import { PaymentList } from "@/components/business/payment/PaymentForm";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dictionary } from "@/lib/i18n";
import type { PaymentFeedRow } from "@/lib/server/paymentsFeed";

type PaymentRowClient = Omit<PaymentFeedRow, "createdAt"> & {
  createdAt: Date | null;
};

type PaymentsFeedClientProps = {
  locale: string;
  t: Dictionary;
  initialRows: PaymentFeedRow[];
  initialHasMore: boolean;
  pageSize: number;
};

const normalizeRows = (rows: PaymentFeedRow[]): PaymentRowClient[] =>
  rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? new Date(row.createdAt) : null,
  }));

export function PaymentsFeedClient({
  locale,
  t,
  initialRows,
  initialHasMore,
  pageSize,
}: PaymentsFeedClientProps) {
  const [rows, setRows] = useState<PaymentRowClient[]>(() => normalizeRows(initialRows));
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const unsettledRows = useMemo(() => rows.filter((row) => !row.isSettled), [rows]);
  const settledRows = useMemo(() => rows.filter((row) => row.isSettled), [rows]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        offset: `${rows.length}`,
        limit: `${pageSize}`,
      });
      const response = await fetch(`/api/payments/chunk?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        rows: PaymentFeedRow[];
        hasMore: boolean;
      };
      const nextRows = normalizeRows(payload.rows);
      setRows((prev) => [...prev, ...nextRows]);
      setHasMore(payload.hasMore);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <PageContainer title={t.payments}>
      <div className="space-y-6">
        <PaymentList
          rows={unsettledRows}
          t={t}
          locale={locale}
          title={t.unsettledPayments}
          emptyMessage={t.noUnsettledPayments}
        />

        <details className="rounded-xl border bg-card text-card-foreground shadow">
          <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold">
            {t.settledPayments} ({settledRows.length})
          </summary>
          <div className="px-6 pb-6">
            {settledRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t.noSettledPayments}
              </div>
            ) : (
              <PaymentList
                rows={settledRows}
                t={t}
                locale={locale}
                title={t.settledPayments}
                emptyMessage={t.noSettledPayments}
                variant="plain"
                showTitle={false}
              />
            )}
          </div>
        </details>

        {(hasMore || isLoadingMore) && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore || !hasMore}
                className="cursor-pointer"
              >
                {isLoadingMore ? t.loadingMore ?? t.saving : t.loadMore}
              </Button>
            </div>
            {isLoadingMore && (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
