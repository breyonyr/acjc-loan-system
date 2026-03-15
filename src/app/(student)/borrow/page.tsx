import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { BorrowFormLoader } from "@/components/borrow-form-loader";
import type { Equipment } from "@/lib/types";

export default async function BorrowPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: equipment } = await supabaseAdmin
    .from("equipment")
    .select("*")
    .eq("status", "available")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Borrow equipment</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Search inventory or add custom items, set your dates, and submit.
        </p>
      </div>

      <BorrowFormLoader
        user={{ name: user.name, email: user.email }}
        availableEquipment={(equipment as Equipment[]) || []}
      />
    </div>
  );
}
