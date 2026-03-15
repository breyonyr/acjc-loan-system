"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import type { Loan } from "@/lib/types";
import { getLoanItemName, getShortLoanId, formatCheckoutDate } from "@/lib/loan-utils";
import { format, isPast } from "date-fns";
import { returnEquipment, returnBatch, deleteLoan } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LoanDetailModalProps {
  loans: Loan[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

function getComputedStatus(loan: Loan): "active" | "returned" | "overdue" {
  if (loan.status === "active" && isPast(new Date(loan.due_date))) {
    return "overdue";
  }
  return loan.status;
}

export function LoanDetailModal({ loans, open, onOpenChange, isAdmin = false }: LoanDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [returnedIds, setReturnedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const router = useRouter();

  if (loans.length === 0) return null;

  const firstLoan = loans[0];
  const batchId = firstLoan.batch_id;
  const loanId = batchId ? getShortLoanId(batchId) : getShortLoanId(firstLoan.id);
  const hasActiveLoans = loans.some(
    (l) => (l.status === "active" || getComputedStatus(l) === "overdue") && !returnedIds.has(l.id)
  );
  const activeLoansInBatch = loans.filter(
    (l) => (l.status === "active" || getComputedStatus(l) === "overdue") && !returnedIds.has(l.id)
  );

  function handleReturnSingle(loanId: string, name: string) {
    startTransition(async () => {
      const result = await returnEquipment(loanId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`${result.equipmentName || name} returned`);
        setReturnedIds((prev) => new Set(prev).add(loanId));
        router.refresh();
      }
    });
  }

  function handleDeleteLoan() {
    startTransition(async () => {
      // Delete all loans in this group in parallel
      const results = await Promise.all(loans.map((loan) => deleteLoan(loan.id)));
      const failed = results.find((r) => !r.success);
      if (failed) {
        toast.error(failed.error);
        return;
      }
      toast.success(loans.length === 1 ? "Loan deleted." : `${loans.length} loans deleted.`);
      onOpenChange(false);
      setDeleteConfirmOpen(false);
      router.refresh();
    });
  }

  function handleReturnAll() {
    if (!batchId) {
      // Single loan, use returnEquipment
      handleReturnSingle(firstLoan.id, getLoanItemName(firstLoan));
      return;
    }
    startTransition(async () => {
      const result = await returnBatch(batchId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`${result.count} items returned`);
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base">Loan Details</DialogTitle>
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
              {loanId}
            </span>
          </div>
        </DialogHeader>

        {/* Borrower */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Borrower</p>
            <p className="text-sm font-medium">{firstLoan.user?.name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{firstLoan.user?.email}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Checked out</p>
              <p className="text-sm">{formatCheckoutDate(firstLoan)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Due date</p>
              <p className="text-sm">{format(new Date(firstLoan.due_date), "MMM d, yyyy")}</p>
            </div>
          </div>

          {/* Returned date (if applicable) */}
          {firstLoan.status === "returned" && firstLoan.returned_at && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Returned</p>
              <p className="text-sm">{format(new Date(firstLoan.returned_at), "MMM d, yyyy 'at' h:mm a")}</p>
              {firstLoan.returned_by && firstLoan.returned_by !== firstLoan.user_id && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Returned by{" "}
                  <span className="font-medium text-foreground">
                    {firstLoan.returned_by_user?.name || "another student"}
                  </span>
                  {" "}on behalf of {firstLoan.user?.name || "the borrower"}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {firstLoan.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{firstLoan.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Items ({loans.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {loans.map((loan) => {
                const status = returnedIds.has(loan.id) ? "returned" : getComputedStatus(loan);
                const isActive = status === "active" || status === "overdue";
                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-words">{getLoanItemName(loan)}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {getShortLoanId(loan.id)}
                      </span>
                    </div>
                    {isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-8 text-xs"
                        disabled={isPending}
                        onClick={() => handleReturnSingle(loan.id, getLoanItemName(loan))}
                      >
                        Return
                      </Button>
                    ) : (
                      <StatusBadge status={status} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Return All button */}
          {hasActiveLoans && activeLoansInBatch.length > 1 && (
            <Button
              className="w-full"
              disabled={isPending}
              onClick={handleReturnAll}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Returning...
                </span>
              ) : (
                `Return all ${activeLoansInBatch.length} items`
              )}
            </Button>
          )}

          {/* Single active loan — show return button if not already shown inline */}
          {hasActiveLoans && activeLoansInBatch.length === 1 && loans.length === 1 && (
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => handleReturnSingle(activeLoansInBatch[0].id, getLoanItemName(activeLoansInBatch[0]))}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Returning...
                </span>
              ) : (
                "Return item"
              )}
            </Button>
          )}

          {/* Admin Delete */}
          {isAdmin && (
            <>
              {!deleteConfirmOpen ? (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/30"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={isPending}
                >
                  Delete {loans.length === 1 ? "loan" : `${loans.length} loans`}
                </Button>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 p-3 space-y-3">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Are you sure? This will permanently delete{" "}
                    {loans.length === 1 ? "this loan record" : `these ${loans.length} loan records`}.
                    {hasActiveLoans && " Active loans will release equipment back to inventory."}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeleteConfirmOpen(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={handleDeleteLoan}
                      disabled={isPending}
                    >
                      {isPending ? "Deleting..." : "Confirm Delete"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
