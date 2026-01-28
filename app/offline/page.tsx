import { PageContainer } from "@/components/business/layout/PageContainer";

export default function OfflinePage() {
  return (
    <PageContainer title="You are offline">
      <p className="text-muted-foreground">
        Connect to the internet to continue using Money Tracker.
      </p>
    </PageContainer>
  );
}
