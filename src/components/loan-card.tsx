"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { Loan } from "@/lib/types";
import { getLoanItemName, formatCheckoutDate } from "@/lib/loan-utils";
import { formatDistanceToNow, isPast, format } from "date-fns";

export function LoanCard({ loan }: { loan: Loan }) {
  const dueDate = new Date(loan.due_date);
  const isOverdue = isPast(dueDate) && loan.status === "active";
  const status = isOverdue ? "overdue" : loan.status;

  const daysInfo = loan.status === "active"
    ? isOverdue
      ? `Overdue by ${formatDistanceToNow(dueDate)}`
      : `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`
    : `Returned ${loan.returned_at ? format(new Date(loan.returned_at), "MMM d") : ""}`;

  return (
    <Card className={isOverdue ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20" : ""}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {getLoanItemName(loan)}
          </h3>
          <p className="text-xs text-muted-foreground">
            Checked out {formatCheckoutDate(loan)}
          </p>
          <p
            className={`text-xs font-medium ${
              isOverdue ? "text-red-600 dark:text-red-400" : loan.status === "active" ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
            }`}
          >
            {daysInfo}
          </p>
        </div>
        <StatusBadge status={status} />
      </CardContent>
    </Card>
  );
}
