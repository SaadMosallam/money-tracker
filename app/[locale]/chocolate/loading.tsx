import { Skeleton } from "@/components/ui/skeleton";

export default function ChocolateLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">
      <div className="inline-flex rounded-lg border bg-muted p-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
