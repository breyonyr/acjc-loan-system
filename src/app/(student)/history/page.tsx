import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Loan } from "@/lib/types";
import { LoanHistoryList } from "@/components/loan-history-list";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status || "all";
  const searchQuery = params.q || "";

  let query = supabaseAdmin
    .from("loans")
    .select("*, equipment(*), user:users(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter !== "all") {
    if (statusFilter === "overdue") {
      query = query
        .eq("status", "active")
        .lt("due_date", new Date().toISOString());
    } else {
      query = query.eq("status", statusFilter);
    }
  }

  const { data: loans } = await query;

  let filteredLoans = (loans as Loan[]) || [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredLoans = filteredLoans.filter(
      (loan) =>
        loan.user?.name?.toLowerCase().includes(q) ||
        loan.equipment?.name?.toLowerCase().includes(q) ||
        loan.custom_item_name?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Loan History</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          All equipment loans across the school.
        </p>
      </div>
      <LoanHistoryList
        loans={filteredLoans}
        initialStatus={statusFilter}
        initialQuery={searchQuery}
      />
    </div>
  );
}
