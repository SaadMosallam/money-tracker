import { getDictionary, Locale } from "@/lib/i18n";
import { EXPENSES_PAGE_SIZE, getExpenseFeedChunk } from "@/lib/server/expensesFeed";
import { PAYMENTS_PAGE_SIZE, getPaymentFeedChunk } from "@/lib/server/paymentsFeed";
import { HistoryClient } from "@/components/business/history/HistoryClient";

type HistoryPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const [expensesData, paymentsData] = await Promise.all([
    getExpenseFeedChunk({ offset: 0, limit: EXPENSES_PAGE_SIZE }),
    getPaymentFeedChunk({ offset: 0, limit: PAYMENTS_PAGE_SIZE }),
  ]);

  return (
    <HistoryClient
      locale={locale}
      t={t}
      initialExpenses={expensesData.rows}
      initialExpensesHasMore={expensesData.hasMore}
      expensesPageSize={EXPENSES_PAGE_SIZE}
      initialPayments={paymentsData.rows}
      initialPaymentsHasMore={paymentsData.hasMore}
      paymentsPageSize={PAYMENTS_PAGE_SIZE}
    />
  );
}
