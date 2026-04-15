import { getDictionary, Locale } from "@/lib/i18n";
import { EXPENSES_PAGE_SIZE, getExpenseFeedChunk } from "@/lib/server/expensesFeed";
import { ExpensesFeedClient } from "@/components/business/expense/ExpensesFeedClient";

type ExpensesPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const { rows, hasMore } = await getExpenseFeedChunk({
    offset: 0,
    limit: EXPENSES_PAGE_SIZE,
  });

  return (
    <ExpensesFeedClient
      locale={locale}
      t={t}
      initialRows={rows}
      initialHasMore={hasMore}
      pageSize={EXPENSES_PAGE_SIZE}
    />
  );
}
