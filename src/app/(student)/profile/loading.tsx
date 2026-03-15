import { Skeleton } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-6 w-16" />

      {/* User info card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <section>
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-10" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
