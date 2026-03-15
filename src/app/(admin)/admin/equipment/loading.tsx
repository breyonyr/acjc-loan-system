import { Skeleton } from "@/components/skeleton";

export default function AdminEquipmentLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-2" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[600px]">
          {/* Table header */}
          <div className="flex border-b border-border bg-muted/50 px-4 py-3">
            <Skeleton className="h-3 w-24 flex-[2]" />
            <Skeleton className="h-3 w-16 flex-1" />
            <Skeleton className="h-3 w-16 flex-1" />
            <Skeleton className="h-3 w-16 flex-1" />
            <Skeleton className="h-3 w-12 flex-1" />
          </div>
          {/* Table rows */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center border-b border-border px-4 py-3 last:border-0">
              <div className="flex-[2] space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex-1 text-right">
                <Skeleton className="ml-auto h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
