import { supabaseAdmin } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import type { Loan } from "@/lib/types";
import { getLoanItemName } from "@/lib/loan-utils";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { DeleteLoanButton } from "@/components/delete-loan-button";

export default async function AdminDashboardPage() {
  // Run all 5 queries in parallel instead of sequentially
  const [
    { count: totalEquipment },
    { count: checkedOutCount },
    { count: availableCount },
    { data: overdueLoans },
    { data: recentLoans },
  ] = await Promise.all([
    supabaseAdmin
      .from("equipment")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("equipment")
      .select("*", { count: "exact", head: true })
      .eq("status", "checked_out"),
    supabaseAdmin
      .from("equipment")
      .select("*", { count: "exact", head: true })
      .eq("status", "available"),
    supabaseAdmin
      .from("loans")
      .select("*, equipment(*), user:users(*)")
      .eq("status", "active")
      .lt("due_date", new Date().toISOString())
      .order("due_date", { ascending: true })
      .limit(50),
    supabaseAdmin
      .from("loans")
      .select("*, equipment(*), user:users(*)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const overdueCount = overdueLoans?.length || 0;

  const stats = [
    { label: "Total", value: totalEquipment || 0, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30", borderColor: "border-indigo-200 dark:border-indigo-800" },
    { label: "Checked out", value: checkedOutCount || 0, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
    { label: "Available", value: availableCount || 0, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
    { label: "Overdue", value: overdueCount, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Equipment and loan activity.
          </p>
        </div>
        <Link
          href="/admin/equipment"
          className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Manage equipment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-lg border ${stat.borderColor} ${stat.bg} p-4 shadow-sm`}>
            <p className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {overdueLoans && overdueLoans.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Overdue ({overdueCount})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Overdue by</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overdueLoans as Loan[]).map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{loan.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{loan.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getLoanItemName(loan)}</TableCell>
                    <TableCell className="text-sm">{format(new Date(loan.due_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-red-600">
                        {formatDistanceToNow(new Date(loan.due_date))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DeleteLoanButton loanId={loan.id} itemName={getLoanItemName(loan)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
        {recentLoans && recentLoans.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentLoans as Loan[]).map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="text-sm">{loan.user?.name || "Unknown"}</TableCell>
                    <TableCell className="text-sm">{getLoanItemName(loan)}</TableCell>
                    <TableCell className="text-sm">
                      {loan.status === "returned" ? "Returned" : "Checked out"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(loan.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          loan.status === "active" && new Date(loan.due_date) < new Date()
                            ? "overdue"
                            : loan.status
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DeleteLoanButton loanId={loan.id} itemName={getLoanItemName(loan)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
