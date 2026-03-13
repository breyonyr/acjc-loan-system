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

export default async function AdminDashboardPage() {
  const { count: totalEquipment } = await supabaseAdmin
    .from("equipment")
    .select("*", { count: "exact", head: true });

  const { count: checkedOutCount } = await supabaseAdmin
    .from("equipment")
    .select("*", { count: "exact", head: true })
    .eq("status", "checked_out");

  const { count: availableCount } = await supabaseAdmin
    .from("equipment")
    .select("*", { count: "exact", head: true })
    .eq("status", "available");

  const { data: overdueLoans } = await supabaseAdmin
    .from("loans")
    .select("*, equipment(*), user:users(*)")
    .eq("status", "active")
    .lt("due_date", new Date().toISOString())
    .order("due_date", { ascending: true });

  const { data: recentLoans } = await supabaseAdmin
    .from("loans")
    .select("*, equipment(*), user:users(*)")
    .order("created_at", { ascending: false })
    .limit(10);

  const overdueCount = overdueLoans?.length || 0;

  const stats = [
    { label: "Total", value: totalEquipment || 0 },
    { label: "Checked out", value: checkedOutCount || 0 },
    { label: "Available", value: availableCount || 0 },
    { label: "Overdue", value: overdueCount, highlight: overdueCount > 0 },
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
          className="inline-flex h-9 items-center rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Manage equipment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.highlight ? "text-red-600" : "text-foreground"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {overdueLoans && overdueLoans.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent activity</h2>
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
