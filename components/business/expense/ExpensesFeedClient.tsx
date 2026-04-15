"use client";

import { useMemo, useState } from "react";
import { ExpenseList } from "@/components/business/expense/ExpenseList";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dictionary } from "@/lib/i18n";
import type { ExpenseFeedRow } from "@/lib/server/expensesFeed";

type ExpenseRowClient = Omit<ExpenseFeedRow, "createdAt"> & {
  createdAt: Date | null;
};

type ExpensesFeedClientProps = {
  locale: string;
  t: Dictionary;
  initialRows: ExpenseFeedRow[];
  initialHasMore: boolean;
  pageSize: number;
};

const normalizeRows = (rows: ExpenseFeedRow[]): ExpenseRowClient[] =>
  rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? new Date(row.createdAt) : null,
  }));

export function ExpensesFeedClient({
  locale,
  t,
  initialRows,
  initialHasMore,
  pageSize,
}: ExpensesFeedClientProps) {
  const [rows, setRows] = useState<ExpenseRowClient[]>(() => normalizeRows(initialRows));
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
      const response = await fetch(`/api/expenses/chunk?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        rows: ExpenseFeedRow[];
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
    <PageContainer title={t.expenses} maxWidthClassName="max-w-6xl">
      <div className="space-y-6">
        <ExpenseList
          rows={unsettledRows}
          title={t.unsettledExpenses}
          emptyMessage={t.noUnsettledExpenses}
          t={t}
          locale={locale}
        />

        <details className="rounded-xl border bg-card text-card-foreground shadow">
          <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold">
            {t.settledExpenses} ({settledRows.length})
          </summary>
          <div className="px-6 pb-6">
            {settledRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t.noSettledExpenses}
              </div>
            ) : (
              <ExpenseList
                rows={settledRows}
                title={t.settledExpenses}
                emptyMessage={t.noSettledExpenses}
                variant="plain"
                showTitle={false}
                t={t}
                locale={locale}
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
