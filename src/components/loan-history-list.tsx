"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { LoanDetailModal } from "@/components/loan-detail-modal";
import type { Loan } from "@/lib/types";
import { getLoanItemName, getShortLoanId, formatCheckoutDate } from "@/lib/loan-utils";
import { format, isPast } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

interface LoanHistoryListProps {
  loans: Loan[];
  initialStatus: string;
  initialQuery: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  isAdmin?: boolean;
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "returned", label: "Returned" },
  { value: "overdue", label: "Overdue" },
];

function getComputedStatus(loan: Loan): "active" | "returned" | "overdue" {
  if (loan.status === "active" && isPast(new Date(loan.due_date))) {
    return "overdue";
  }
  return loan.status;
}

/** Group loans by batch_id. Loans without a batch_id get their own group keyed by loan id. */
function groupByBatch(loans: Loan[]): Map<string, Loan[]> {
  const map = new Map<string, Loan[]>();
  for (const loan of loans) {
    const key = loan.batch_id ?? loan.id;
    const group = map.get(key);
    if (group) {
      group.push(loan);
    } else {
      map.set(key, [loan]);
    }
  }
  return map;
}

/** Get the overall status for a loan group (worst status wins). */
function getGroupStatus(loans: Loan[]): "active" | "returned" | "overdue" {
  const statuses = loans.map(getComputedStatus);
  if (statuses.includes("overdue")) return "overdue";
  if (statuses.includes("active")) return "active";
  return "returned";
}

export function LoanHistoryList({
  loans,
  initialStatus,
  initialQuery,
  currentPage,
  totalPages,
  totalCount,
  isAdmin = false,
}: LoanHistoryListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedLoans, setSelectedLoans] = useState<Loan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateSearch = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
      if (key !== "page") {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`/history?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateSearch("q", value);
      }, 300);
    },
    [updateSearch]
  );

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`/history?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  // Memoize expensive grouping computation
  const groupEntries = useMemo(() => {
    const groups = groupByBatch(loans);
    return Array.from(groups.entries());
  }, [loans]);

  function openModal(loansInGroup: Loan[]) {
    setSelectedLoans(loansInGroup);
    setModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            type="search"
            placeholder="Search by student or item..."
            defaultValue={initialQuery}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-md border border-border bg-muted/50 p-0.5">
          {statusFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => updateSearch("status", option.value)}
              className={cn(
                "rounded-[5px] px-3 py-1 text-xs font-medium transition-all",
                initialStatus === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {isPending && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        )}
      </div>

      {/* Results */}
      {groupEntries.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Checked Out</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupEntries.map(([key, groupLoans]) => {
                  const first = groupLoans[0];
                  const loanId = first.batch_id
                    ? getShortLoanId(first.batch_id)
                    : getShortLoanId(first.id);
                  const itemCount = groupLoans.length;
                  const itemLabel =
                    itemCount === 1
                      ? getLoanItemName(first)
                      : `${getLoanItemName(first)} +${itemCount - 1} more`;

                  return (
                    <TableRow
                      key={key}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openModal(groupLoans)}
                    >
                      <TableCell>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                          {loanId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{first.user?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{first.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{itemLabel}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatCheckoutDate(first)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(first.due_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={getGroupStatus(groupLoans)} />
                          {first.status === "returned" && first.returned_by && first.returned_by !== first.user_id && (
                            <span className="text-[10px] text-muted-foreground">
                              by {first.returned_by_user?.name || "another student"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {groupEntries.map(([key, groupLoans]) => {
              const first = groupLoans[0];
              const loanId = first.batch_id
                ? getShortLoanId(first.batch_id)
                : getShortLoanId(first.id);
              const itemCount = groupLoans.length;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-card p-4 active:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => openModal(groupLoans)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{first.user?.name || "Unknown"}</p>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {loanId}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{first.user?.email}</p>
                    </div>
                    <StatusBadge status={getGroupStatus(groupLoans)} />
                  </div>
                  <p className="mt-2 text-sm font-medium truncate">
                    {getLoanItemName(first)}
                    {itemCount > 1 && (
                      <span className="text-muted-foreground font-normal">
                        {" "}+{itemCount - 1} more
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Out: {formatCheckoutDate(first, true)}</span>
                    <span>&middot;</span>
                    <span>Due: {format(new Date(first.due_date), "MMM d")}</span>
                  </div>
                  {first.status === "returned" && first.returned_by && first.returned_by !== first.user_id && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Returned by <span className="font-medium">{first.returned_by_user?.name || "another student"}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? "loan" : "loans"} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1 || isPending}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || isPending}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {initialQuery || initialStatus !== "all"
              ? "No loans match your filters."
              : "No loan history yet."}
          </p>
        </div>
      )}

      {/* Loan Detail Modal */}
      <LoanDetailModal
        loans={selectedLoans}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isAdmin={isAdmin}
      />
    </div>
  );
}
