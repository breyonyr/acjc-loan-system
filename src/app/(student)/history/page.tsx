import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Loan } from "@/lib/types";
import { LoanHistoryList } from "@/components/loan-history-list";
import { sanitizeFilterInput } from "@/lib/sanitize";

const PAGE_SIZE = 20;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status || "all";
  const rawQuery = params.q || "";
  const searchQuery = sanitizeFilterInput(rawQuery);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const isAdmin = user.role === "admin";

  let query = supabaseAdmin
    .from("loans")
    .select("*, equipment(*), user:users!loans_user_id_fkey(*), returned_by_user:users!loans_returned_by_fkey(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter !== "all") {
    if (statusFilter === "overdue") {
      query = query
        .eq("status", "active")
        .lt("due_date", new Date().toISOString());
    } else {
      query = query.eq("status", statusFilter);
    }
  }

  if (searchQuery) {
    // Search users and equipment by name in parallel
    const [usersResult, equipmentResult] = await Promise.all([
      supabaseAdmin.from("users").select("id").ilike("name", `%${searchQuery}%`),
      supabaseAdmin.from("equipment").select("id").ilike("name", `%${searchQuery}%`),
    ]);
    const matchingUserIds = (usersResult.data || []).map((u) => u.id);
    const matchingEquipmentIds = (equipmentResult.data || []).map((e) => e.id);

    const conditions = [
      `custom_item_name.ilike.%${searchQuery}%`,
      `notes.ilike.%${searchQuery}%`,
    ];
    if (matchingUserIds.length > 0) {
      conditions.push(`user_id.in.(${matchingUserIds.join(",")})`);
    }
    if (matchingEquipmentIds.length > 0) {
      conditions.push(`equipment_id.in.(${matchingEquipmentIds.join(",")})`);
    }
    query = query.or(conditions.join(","));
  }

  const { data: loans, count } = await query;

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Loan History</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isAdmin ? "All equipment loans across the school." : "Your equipment loan history."}
          </p>
        </div>
        {isAdmin && (
          <a
            href="/api/export-loans"
            download
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export CSV
          </a>
        )}
      </div>
      <LoanHistoryList
        loans={(loans as Loan[]) || []}
        initialStatus={statusFilter}
        initialQuery={searchQuery}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isAdmin={user.role === "admin"}
      />
    </div>
  );
}
