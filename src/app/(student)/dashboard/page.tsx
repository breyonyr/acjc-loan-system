import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { ReturnButton } from "@/components/return-button";
import { ReturnBatchButton } from "@/components/return-batch-button";
import Link from "next/link";
import type { Loan } from "@/lib/types";
import { getLoanItemName, formatCheckoutDate } from "@/lib/loan-utils";
import { format, formatDistanceToNow, isPast, differenceInHours, differenceInDays, addDays } from "date-fns";

type BatchGroup = { batchId: string | null; loans: Loan[] };

function groupByBatch(loans: Loan[]): BatchGroup[] {
  const batchMap = new Map<string, Loan[]>();
  const unbatched: Loan[] = [];

  for (const loan of loans) {
    if (loan.batch_id) {
      const existing = batchMap.get(loan.batch_id);
      if (existing) {
        existing.push(loan);
      } else {
        batchMap.set(loan.batch_id, [loan]);
      }
    } else {
      unbatched.push(loan);
    }
  }

  const groups: BatchGroup[] = [];
  for (const [batchId, batchLoans] of batchMap) {
    groups.push({ batchId, loans: batchLoans });
  }
  for (const loan of unbatched) {
    groups.push({ batchId: null, loans: [loan] });
  }
  return groups;
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: activeLoans } = await supabaseAdmin
    .from("loans")
    .select("*, equipment(*)")
    .eq("user_id", user.id)
    .in("status", ["active", "overdue"])
    .order("due_date", { ascending: true });

  const activeCount = activeLoans?.length || 0;
  const overdueCount = (activeLoans as Loan[] | null)?.filter(
    (loan) => isPast(new Date(loan.due_date))
  ).length || 0;

  const batchGroups = groupByBatch((activeLoans as Loan[]) || []);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Hi, {user.name?.split(" ")[0]}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {activeCount === 0
              ? "You have no active loans."
              : `You have ${activeCount} active ${activeCount === 1 ? "loan" : "loans"}.`}
          </p>
        </div>
        <Link
          href="/borrow"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Borrow equipment
        </Link>
      </div>

      {/* Banned Warning */}
      {user.status === "banned" && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
              <circle cx="12" cy="12" r="10" />
              <path d="m4.9 4.9 14.2 14.2" />
            </svg>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300">
            <span className="font-medium">Your account has been suspended.</span>{" "}
            You cannot borrow equipment. Contact an admin if you believe this is a mistake.
          </p>
        </div>
      )}

      {/* Overdue Warning */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300">
            <span className="font-medium">{overdueCount} {overdueCount === 1 ? "item is" : "items are"} overdue.</span>{" "}
            Please return {overdueCount === 1 ? "it" : "them"} as soon as possible.
          </p>
        </div>
      )}

      {/* Active Loans */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Active Loans</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{activeCount}</span>
          )}
        </div>
        {batchGroups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {batchGroups.map((group, groupIndex) => {
              const isBatch = group.loans.length > 1 && group.batchId;

              if (isBatch) {
                // Batch card — multiple items borrowed together
                const hasOverdue = group.loans.some((l) => isPast(new Date(l.due_date)));
                const firstLoan = group.loans[0];
                const itemNames = group.loans.map((l) => getLoanItemName(l));

                return (
                  <div
                    key={group.batchId}
                    className={`rounded-lg border p-4 shadow-sm animate-fade-in-up ${
                      hasOverdue ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20" : "border-border bg-card"
                    }`}
                    style={{ "--stagger": groupIndex } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {group.loans.length} items
                          <span className="text-muted-foreground font-normal">
                            {" "}&middot; Borrowed {formatCheckoutDate(firstLoan, true)}
                          </span>
                        </p>
                      </div>
                      <ReturnBatchButton
                        batchId={group.batchId!}
                        itemCount={group.loans.length}
                        itemNames={itemNames}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {group.loans.map((loan) => {
                        const dueDate = new Date(loan.due_date);
                        const isOverdue = isPast(dueDate) && loan.status === "active";
                        return (
                          <div
                            key={loan.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/50 px-3 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {getLoanItemName(loan)}
                              </p>
                              <p className={`mt-0.5 text-xs font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                                {isOverdue
                                  ? `Overdue by ${formatDistanceToNow(dueDate)}`
                                  : `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`}
                              </p>
                            </div>
                            <ReturnButton loanId={loan.id} equipmentName={getLoanItemName(loan)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Single loan card (legacy or single-item borrow)
              const loan = group.loans[0];
              const dueDate = new Date(loan.due_date);
              const isOverdue = isPast(dueDate) && loan.status === "active";
              return (
                <div
                  key={loan.id}
                  className={`flex items-center justify-between gap-4 rounded-lg border p-4 shadow-sm animate-fade-in-up ${
                    isOverdue ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20" : "border-border bg-card"
                  }`}
                  style={{ "--stagger": groupIndex } as React.CSSProperties}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {getLoanItemName(loan)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Borrowed {formatCheckoutDate(loan, true)}
                    </p>
                    <p className={`mt-0.5 text-xs font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                      {isOverdue
                        ? `Overdue by ${formatDistanceToNow(dueDate)}`
                        : `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`}
                    </p>
                  </div>
                  <ReturnButton loanId={loan.id} equipmentName={getLoanItemName(loan)} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" x2="12" y1="22" y2="12" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              No active loans.{" "}
              <Link href="/borrow" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
                Borrow equipment
              </Link>{" "}
              to get started.
            </p>
          </div>
        )}
      </section>

      {/* Upcoming Due Dates */}
      {(() => {
        const upcoming = ((activeLoans as Loan[]) || [])
          .filter((l) => !isPast(new Date(l.due_date)))
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 5);

        if (upcoming.length === 0) return null;

        return (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Due Soon
            </h2>
            <div className="flex flex-col gap-2">
              {upcoming.map((loan) => {
                const dueDate = new Date(loan.due_date);
                const hoursLeft = differenceInHours(dueDate, new Date());
                const daysLeft = differenceInDays(dueDate, new Date());
                const isUrgent = hoursLeft <= 24;

                return (
                  <div
                    key={loan.id}
                    className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${
                      isUrgent
                        ? "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {getLoanItemName(loan)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Due {format(dueDate, "MMM d 'at' h:mm a")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isUrgent
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {hoursLeft < 1
                        ? "< 1 hr"
                        : daysLeft === 0
                        ? `${hoursLeft}h left`
                        : daysLeft === 1
                        ? "1 day left"
                        : `${daysLeft} days left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
