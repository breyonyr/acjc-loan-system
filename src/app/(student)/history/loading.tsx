import { Skeleton } from "@/components/skeleton";

export default function HistoryLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="flex gap-2">
          {["All", "Active", "Returned", "Overdue"].map((label) => (
            <Skeleton key={label} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Desktop table skeleton (hidden on mobile) */}
      <div className="hidden sm:block">
        <div className="rounded-lg border border-border">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-border px-4 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28 flex-1" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Table rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile cards skeleton (hidden on desktop) */}
      <div className="flex flex-col gap-2 sm:hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
