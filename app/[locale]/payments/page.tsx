import { getDictionary, Locale } from "@/lib/i18n";
import { PAYMENTS_PAGE_SIZE, getPaymentFeedChunk } from "@/lib/server/paymentsFeed";
import { PaymentsFeedClient } from "@/components/business/payment/PaymentsFeedClient";

type PaymentsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const { rows, hasMore } = await getPaymentFeedChunk({
    offset: 0,
    limit: PAYMENTS_PAGE_SIZE,
  });

  return (
    <PaymentsFeedClient
      locale={locale}
      t={t}
      initialRows={rows}
      initialHasMore={hasMore}
      pageSize={PAYMENTS_PAGE_SIZE}
    />
  );
}
