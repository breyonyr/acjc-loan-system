import { Skeleton } from "@/components/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Approval toggle */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Search */}
      <Skeleton className="h-9 w-full max-w-sm rounded-md" />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[700px]">
          <div className="flex border-b border-border bg-muted/50 px-4 py-3">
            <Skeleton className="h-3 w-16 flex-1" />
            <Skeleton className="h-3 w-16 flex-[2]" />
            <Skeleton className="h-3 w-12 flex-1" />
            <Skeleton className="h-3 w-12 flex-1" />
            <Skeleton className="h-3 w-16 flex-1" />
            <Skeleton className="h-3 w-16 flex-1" />
            <Skeleton className="h-3 w-8" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center border-b border-border px-4 py-3 last:border-0">
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex-[2]">
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-6" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-20" />
              </div>
              <div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
