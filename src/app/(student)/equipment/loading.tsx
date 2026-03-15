import { Skeleton } from "@/components/skeleton";

export default function EquipmentLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-4 w-36" />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-8 w-64 rounded-md" />
      </div>

      {/* Equipment grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-border p-4"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
