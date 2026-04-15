import { PageContainer } from "@/components/business/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <Skeleton className="h-8 w-36" />

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-3 w-56" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-10 w-44" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

