import { Skeleton } from "@/components/skeleton";

export default function BorrowLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Add items section */}
      <section className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-10 w-full rounded-md" />
      </section>

      {/* Cart section */}
      <section className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="rounded-lg border border-dashed border-border px-6 py-10">
          <Skeleton className="mx-auto h-4 w-60" />
        </div>
      </section>

      {/* Loan details section */}
      <section className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Borrower */}
          <div className="space-y-1.5 sm:col-span-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
          {/* Loan date */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {/* Due date */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {/* Notes */}
          <div className="space-y-1.5 sm:col-span-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        </div>
      </section>

      {/* Submit button */}
      <Skeleton className="h-11 w-full rounded-md sm:w-40" />
    </div>
  );
}
