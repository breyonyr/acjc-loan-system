import { supabaseAdmin } from "@/lib/supabase";
import { EquipmentCard } from "@/components/equipment-card";
import { EquipmentSearch } from "@/components/equipment-search";
import type { Equipment } from "@/lib/types";

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "available";

  let supabaseQuery = supabaseAdmin
    .from("equipment")
    .select("*")
    .order("name", { ascending: true });

  if (statusFilter && statusFilter !== "all") {
    supabaseQuery = supabaseQuery.eq("status", statusFilter);
  }

  if (query) {
    supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
  }

  const { data: equipment } = await supabaseQuery;
  const count = equipment?.length || 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Equipment</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {count} {statusFilter === "all" ? "total" : statusFilter} {count === 1 ? "item" : "items"}
        </p>
      </div>

      <EquipmentSearch initialQuery={query} initialStatus={statusFilter} />

      {equipment && equipment.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {(equipment as Equipment[]).map((item) => (
            <EquipmentCard key={item.id} equipment={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            {query
              ? `No results for "${query}"`
              : "No equipment available."}
          </p>
        </div>
      )}
    </div>
  );
}
