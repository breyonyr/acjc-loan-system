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
import { getLoanItemName, getShortLoanId } from "@/lib/loan-utils";
import { format, isPast } from "date-fns";
import { returnEquipment, returnBatch } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LoanDetailModalProps {
  loans: Loan[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getComputedStatus(loan: Loan): "active" | "returned" | "overdue" {
  if (loan.status === "active" && isPast(new Date(loan.due_date))) {
    return "overdue";
  }
  return loan.status;
}

export function LoanDetailModal({ loans, open, onOpenChange }: LoanDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [returnedIds, setReturnedIds] = useState<Set<string>>(new Set());
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
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.equipmentName || name} returned`);
        setReturnedIds((prev) => new Set(prev).add(loanId));
        router.refresh();
      }
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
      if (result.error) {
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Borrower</p>
            <p className="text-sm font-medium">{firstLoan.user?.name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{firstLoan.user?.email}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Checked out</p>
              <p className="text-sm">{format(new Date(firstLoan.checked_out_at), "MMM d, yyyy")}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(firstLoan.checked_out_at), "h:mm a")}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Due date</p>
              <p className="text-sm">{format(new Date(firstLoan.due_date), "MMM d, yyyy")}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(firstLoan.due_date), "h:mm a")}</p>
            </div>
          </div>

          {/* Returned date (if applicable) */}
          {firstLoan.status === "returned" && firstLoan.returned_at && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Returned</p>
              <p className="text-sm">{format(new Date(firstLoan.returned_at), "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
          )}

          {/* Notes */}
          {firstLoan.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{firstLoan.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{getLoanItemName(loan)}</p>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {getShortLoanId(loan.id)}
                        </span>
                      </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
