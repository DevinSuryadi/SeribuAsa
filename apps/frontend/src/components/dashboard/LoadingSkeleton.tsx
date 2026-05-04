import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-10 w-48 mb-3" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

export function CardSkeletonGrid({ count = 4, columns = 4 }: { count?: number; columns?: number }) {
  const gridClass = `grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`;
  
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/50">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <CardSkeletonGrid count={4} columns={4} />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-48" />
        </div>
        <ListItemSkeleton count={5} />
      </div>
    </div>
  );
}
