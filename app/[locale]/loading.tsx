import { PageContainer } from "@/components/business/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <div className="space-y-8 overflow-x-hidden">
        <Skeleton className="h-8 w-44" />

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-40 max-w-full" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16 justify-self-start" />
                <Skeleton className="h-4 w-20 justify-self-end" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-36 max-w-full" />
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-36 max-w-full" />
                  </div>
                  <Skeleton className="h-4 w-20 justify-self-end" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

