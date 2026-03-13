import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { StatusBadge } from "@/components/status-badge";
import type { Equipment, Loan } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";

const categoryIcons: Record<string, string> = {
  audio: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8",
  visual: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  cables: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  other: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
};

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: equipment } = await supabaseAdmin
    .from("equipment")
    .select("*")
    .eq("id", id)
    .single();

  if (!equipment) notFound();

  const item = equipment as Equipment;

  // Check if there's an active loan for this equipment
  let activeLoan: Loan | null = null;
  if (item.status === "checked_out") {
    const { data } = await supabaseAdmin
      .from("loans")
      .select("*, user:users(name)")
      .eq("equipment_id", id)
      .in("status", ["active", "overdue"])
      .maybeSingle();
    activeLoan = data as Loan | null;
  }

  // Check if current user already has this item
  const { data: userLoan } = await supabaseAdmin
    .from("loans")
    .select("id")
    .eq("equipment_id", id)
    .eq("user_id", user.id)
    .in("status", ["active", "overdue"])
    .maybeSingle();

  const userHasItem = !!userLoan;
  const iconPath = categoryIcons[item.category || "other"] || categoryIcons.other;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/equipment"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Equipment
      </Link>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath} />
            </svg>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold">{item.name}</h1>
                {item.category && (
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground capitalize">
                    {item.category}
                  </p>
                )}
              </div>
              <StatusBadge status={item.status} />
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            )}

            {item.status === "checked_out" && activeLoan && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Currently unavailable. Expected return:{" "}
                <span className="font-medium text-foreground">
                  {format(new Date(activeLoan.due_date), "MMM d, yyyy")}
                </span>
              </div>
            )}

            {item.status === "available" && !userHasItem && (
              <div className="mt-1">
                <Link
                  href="/borrow"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                >
                  Borrow this item
                </Link>
              </div>
            )}

            {userHasItem && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                You have this item checked out.{" "}
                <Link href="/dashboard" className="font-medium underline underline-offset-4">
                  Return it from your dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
