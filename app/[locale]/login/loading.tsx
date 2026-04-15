import { PageContainer } from "@/components/business/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer maxWidthClassName="max-w-md">
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

