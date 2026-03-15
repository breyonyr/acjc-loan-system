import { Skeleton } from "@/components/skeleton";

export default function EquipmentDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Skeleton className="h-4 w-24" />

      {/* Equipment card */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-1 h-9 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
