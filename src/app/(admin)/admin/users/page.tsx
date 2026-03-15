import { supabaseAdmin } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActions } from "@/components/user-actions";
import { ApprovalToggle } from "@/components/approval-toggle";
import { BulkApproveButton } from "@/components/bulk-approve-button";
import { UserFilter } from "@/components/user-filter";
import { isApprovalRequired } from "@/lib/settings";
import { sanitizeFilterInput } from "@/lib/sanitize";
import type { User } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string; role?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = sanitizeFilterInput(params.q || "");
  const statusFilter = sanitizeFilterInput(params.status || "all");
  const roleFilter = sanitizeFilterInput(params.role || "all");
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Fetch users + approval settings in parallel
  let usersQuery = supabaseAdmin
    .from("users")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (searchQuery) {
    usersQuery = usersQuery.or(
      `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
    );
  }

  if (statusFilter && statusFilter !== "all") {
    usersQuery = usersQuery.eq("status", statusFilter);
  }

  if (roleFilter && roleFilter !== "all") {
    usersQuery = usersQuery.eq("role", roleFilter);
  }

  // Run user fetch + approval setting + pending count in parallel
  const [usersResult, approvalEnabled, pendingResult] = await Promise.all([
    usersQuery,
    isApprovalRequired(),
    supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const { data: users, count } = usersResult;
  const pendingCount = pendingResult.count;

  // Get active loan counts per user (depends on user fetch)
  const userIds = (users || []).map((u) => u.id);
  let loanCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: activeLoans } = await supabaseAdmin
      .from("loans")
      .select("user_id")
      .in("user_id", userIds)
      .in("status", ["active", "overdue"]);

    if (activeLoans) {
      for (const loan of activeLoans) {
        loanCounts[loan.user_id] = (loanCounts[loan.user_id] || 0) + 1;
      }
    }
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Build pagination URL helper
  function paginationUrl(targetPage: number) {
    const p = new URLSearchParams();
    if (searchQuery) p.set("q", searchQuery);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (roleFilter !== "all") p.set("role", roleFilter);
    if (targetPage > 1) p.set("page", String(targetPage));
    const qs = p.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Users</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage student accounts. {totalCount}{" "}
            {totalCount === 1 ? "user" : "users"} total.
            {(pendingCount ?? 0) > 0 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                ({pendingCount} pending)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkApproveButton pendingCount={pendingCount ?? 0} />
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to overview
          </Link>
        </div>
      </div>

      {/* Approval Mode Toggle */}
      <ApprovalToggle enabled={approvalEnabled} />

      {/* Search + Filters */}
      <UserFilter
        initialQuery={searchQuery}
        initialStatus={statusFilter}
        initialRole={roleFilter}
      />

      {/* Users Table */}
      {users && users.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Loans</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as User[]).map((u) => {
                  const activeCount = loanCounts[u.id] || 0;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{u.name}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.status === "banned"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                              : u.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          }`}
                        >
                          {u.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {activeCount > 0 ? (
                          <span className="text-sm font-medium">
                            {activeCount}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            0
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <UserActions
                          user={u}
                          activeLoansCount={activeCount}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={paginationUrl(page - 1)}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={paginationUrl(page + 1)}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all" || roleFilter !== "all"
              ? "No users match your filters."
              : "No users found."}
          </p>
        </div>
      )}
    </div>
  );
}
