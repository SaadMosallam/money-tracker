"use client";

import { useMemo, useState } from "react";
import { Receipt, ArrowRightLeft } from "lucide-react";
import { ExpenseList } from "@/components/business/expense/ExpenseList";
import { PaymentList } from "@/components/business/payment/PaymentForm";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { Dictionary } from "@/lib/i18n";
import type { ExpenseFeedRow } from "@/lib/server/expensesFeed";
import type { PaymentFeedRow } from "@/lib/server/paymentsFeed";

type Tab = "expenses" | "payments";

type ExpenseRowClient = Omit<ExpenseFeedRow, "createdAt"> & { createdAt: Date | null };
type PaymentRowClient = Omit<PaymentFeedRow, "createdAt"> & { createdAt: Date | null };

const normalizeExpenses = (rows: ExpenseFeedRow[]): ExpenseRowClient[] =>
  rows.map((r) => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt) : null }));

const normalizePayments = (rows: PaymentFeedRow[]): PaymentRowClient[] =>
  rows.map((r) => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt) : null }));

type Props = {
  locale: string;
  t: Dictionary;
  initialExpenses: ExpenseFeedRow[];
  initialExpensesHasMore: boolean;
  expensesPageSize: number;
  initialPayments: PaymentFeedRow[];
  initialPaymentsHasMore: boolean;
  paymentsPageSize: number;
};

export function HistoryClient({
  locale,
  t,
  initialExpenses,
  initialExpensesHasMore,
  expensesPageSize,
  initialPayments,
  initialPaymentsHasMore,
  paymentsPageSize,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("expenses");

  // Expenses feed state
  const [expenseRows, setExpenseRows] = useState<ExpenseRowClient[]>(() =>
    normalizeExpenses(initialExpenses),
  );
  const [expensesHasMore, setExpensesHasMore] = useState(initialExpensesHasMore);
  const [loadingMoreExpenses, setLoadingMoreExpenses] = useState(false);

  // Payments feed state
  const [paymentRows, setPaymentRows] = useState<PaymentRowClient[]>(() =>
    normalizePayments(initialPayments),
  );
  const [paymentsHasMore, setPaymentsHasMore] = useState(initialPaymentsHasMore);
  const [loadingMorePayments, setLoadingMorePayments] = useState(false);

  const unsettledExpenses = useMemo(() => expenseRows.filter((r) => !r.isSettled), [expenseRows]);
  const settledExpenses = useMemo(() => expenseRows.filter((r) => r.isSettled), [expenseRows]);
  const unsettledPayments = useMemo(() => paymentRows.filter((r) => !r.isSettled), [paymentRows]);
  const settledPayments = useMemo(() => paymentRows.filter((r) => r.isSettled), [paymentRows]);

  const handleLoadMoreExpenses = async () => {
    if (loadingMoreExpenses || !expensesHasMore) return;
    setLoadingMoreExpenses(true);
    try {
      const params = new URLSearchParams({
        offset: `${expenseRows.length}`,
        limit: `${expensesPageSize}`,
      });
      const res = await fetch(`/api/expenses/chunk?${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const payload = (await res.json()) as { rows: ExpenseFeedRow[]; hasMore: boolean };
      setExpenseRows((prev) => [...prev, ...normalizeExpenses(payload.rows)]);
      setExpensesHasMore(payload.hasMore);
    } finally {
      setLoadingMoreExpenses(false);
    }
  };

  const handleLoadMorePayments = async () => {
    if (loadingMorePayments || !paymentsHasMore) return;
    setLoadingMorePayments(true);
    try {
      const params = new URLSearchParams({
        offset: `${paymentRows.length}`,
        limit: `${paymentsPageSize}`,
      });
      const res = await fetch(`/api/payments/chunk?${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const payload = (await res.json()) as { rows: PaymentFeedRow[]; hasMore: boolean };
      setPaymentRows((prev) => [...prev, ...normalizePayments(payload.rows)]);
      setPaymentsHasMore(payload.hasMore);
    } finally {
      setLoadingMorePayments(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "expenses", label: t.expenses, icon: <Receipt className="h-4 w-4" /> },
    { id: "payments", label: t.payments, icon: <ArrowRightLeft className="h-4 w-4" /> },
  ];

  return (
    <PageContainer title={t.history} maxWidthClassName="max-w-6xl">
      <div className="mb-6 inline-flex rounded-lg border bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "expenses" && (
        <div className="space-y-6">
          <ExpenseList
            rows={unsettledExpenses}
            title={t.unsettledExpenses}
            emptyMessage={t.noUnsettledExpenses}
            t={t}
            locale={locale}
          />

          <details className="rounded-xl border bg-card text-card-foreground shadow">
            <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold">
              {t.settledExpenses} ({settledExpenses.length})
            </summary>
            <div className="px-6 pb-6">
              {settledExpenses.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.noSettledExpenses}</div>
              ) : (
                <ExpenseList
                  rows={settledExpenses}
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

          {(expensesHasMore || loadingMoreExpenses) && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadMoreExpenses}
                  disabled={loadingMoreExpenses || !expensesHasMore}
                  className="cursor-pointer"
                >
                  {loadingMoreExpenses ? t.loadingMore ?? t.saving : t.loadMore}
                </Button>
              </div>
              {loadingMoreExpenses && (
                <>
                  <div className="space-y-3 md:hidden">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <div className="hidden w-full md:block">
                    <Card className="w-full">
                      <CardHeader>
                        <Skeleton className="h-6 w-56" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-6">
          <PaymentList
            rows={unsettledPayments}
            t={t}
            locale={locale}
            title={t.unsettledPayments}
            emptyMessage={t.noUnsettledPayments}
          />

          <details className="rounded-xl border bg-card text-card-foreground shadow">
            <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold">
              {t.settledPayments} ({settledPayments.length})
            </summary>
            <div className="px-6 pb-6">
              {settledPayments.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.noSettledPayments}</div>
              ) : (
                <PaymentList
                  rows={settledPayments}
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

          {(paymentsHasMore || loadingMorePayments) && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadMorePayments}
                  disabled={loadingMorePayments || !paymentsHasMore}
                  className="cursor-pointer"
                >
                  {loadingMorePayments ? t.loadingMore ?? t.saving : t.loadMore}
                </Button>
              </div>
              {loadingMorePayments && (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
