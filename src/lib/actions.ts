"use server";

import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ─── Equipment Actions (Admin) ───────────────────────────

export async function createEquipment(formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const image_url = formData.get("image_url") as string;

  const { error } = await supabaseAdmin.from("equipment").insert({
    name,
    description: description || null,
    category: category || null,
    image_url: image_url || null,
    qr_code: crypto.randomUUID(),
    status: "available",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
  revalidatePath("/borrow");
  return { success: true };
}

export async function updateEquipment(id: string, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const image_url = formData.get("image_url") as string;
  const status = formData.get("status") as string;

  const { error } = await supabaseAdmin
    .from("equipment")
    .update({
      name,
      description: description || null,
      category: category || null,
      image_url: image_url || null,
      status: status || "available",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
  revalidatePath("/borrow");
  return { success: true };
}

export async function deleteEquipment(id: string) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabaseAdmin
    .from("equipment")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
  revalidatePath("/borrow");
  return { success: true };
}

// ─── Loan Actions ────────────────────────────────────────

export async function borrowEquipment({
  equipmentIds,
  customItems,
  loanDate,
  dueDate,
  notes,
}: {
  equipmentIds: string[];
  customItems: { name: string; quantity: number }[];
  loanDate: string;
  dueDate: string;
  notes?: string;
}) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  if (equipmentIds.length === 0 && customItems.length === 0) {
    return { error: "No items selected" };
  }

  const batchId = crypto.randomUUID();

  // --- Validate inventory items ---
  let inventoryLoans: Record<string, unknown>[] = [];
  if (equipmentIds.length > 0) {
    const { data: items } = await supabaseAdmin
      .from("equipment")
      .select("id, name, status")
      .in("id", equipmentIds);

    if (!items || items.length !== equipmentIds.length) {
      return { error: "Some items were not found" };
    }

    const unavailable = items.filter((i) => i.status !== "available");
    if (unavailable.length > 0) {
      return { error: `${unavailable.map((i) => i.name).join(", ")} ${unavailable.length === 1 ? "is" : "are"} no longer available` };
    }

    inventoryLoans = equipmentIds.map((equipmentId) => ({
      user_id: user.id,
      equipment_id: equipmentId,
      custom_item_name: null,
      custom_item_quantity: null,
      checked_out_at: loanDate,
      due_date: dueDate,
      status: "active" as const,
      notes: notes || null,
      batch_id: batchId,
    }));
  }

  // --- Build custom item loan rows ---
  const customLoans = customItems.map((item) => ({
    user_id: user.id,
    equipment_id: null,
    custom_item_name: item.name.trim(),
    custom_item_quantity: item.quantity,
    checked_out_at: loanDate,
    due_date: dueDate,
    status: "active" as const,
    notes: notes || null,
    batch_id: batchId,
  }));

  // --- Batch insert all loans ---
  const allLoans = [...inventoryLoans, ...customLoans];
  const { error: loanError } = await supabaseAdmin.from("loans").insert(allLoans);
  if (loanError) return { error: loanError.message };

  // --- Update equipment statuses (only for inventory items) ---
  if (equipmentIds.length > 0) {
    const { error: equipError } = await supabaseAdmin
      .from("equipment")
      .update({ status: "checked_out", updated_at: new Date().toISOString() })
      .in("id", equipmentIds);
    if (equipError) return { error: equipError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/equipment");
  revalidatePath("/borrow");
  revalidatePath("/admin");
  revalidatePath("/history");
  return { success: true, count: allLoans.length };
}

export async function returnEquipment(loanId: string) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  // Find the loan (any authenticated user can return on behalf)
  const { data: loan } = await supabaseAdmin
    .from("loans")
    .select("*, equipment(name)")
    .eq("id", loanId)
    .in("status", ["active", "overdue"])
    .maybeSingle();

  if (!loan) return { error: "Loan not found" };

  // Update loan
  const { error: loanError } = await supabaseAdmin
    .from("loans")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
    })
    .eq("id", loanId);

  if (loanError) return { error: loanError.message };

  // Only update equipment status if this is an inventory item
  if (loan.equipment_id) {
    const { data: otherLoans } = await supabaseAdmin
      .from("loans")
      .select("id")
      .eq("equipment_id", loan.equipment_id)
      .in("status", ["active", "overdue"]);

    if (!otherLoans || otherLoans.length === 0) {
      await supabaseAdmin
        .from("equipment")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", loan.equipment_id);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/equipment");
  revalidatePath("/borrow");
  revalidatePath("/admin");
  revalidatePath("/history");
  const displayName = loan.equipment?.name || loan.custom_item_name || "item";
  return { success: true, equipmentName: displayName };
}

export async function returnBatch(batchId: string) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  // Find all active loans in this batch (any authenticated user can return on behalf)
  const { data: loans } = await supabaseAdmin
    .from("loans")
    .select("id, equipment_id, status")
    .eq("batch_id", batchId)
    .in("status", ["active", "overdue"]);

  if (!loans || loans.length === 0) {
    return { error: "No active loans found in this batch" };
  }

  const loanIds = loans.map((l) => l.id);
  const equipmentIds = loans
    .map((l) => l.equipment_id)
    .filter((id): id is string => id !== null);

  // Mark all loans as returned
  const now = new Date().toISOString();
  const { error: loanError } = await supabaseAdmin
    .from("loans")
    .update({ status: "returned", returned_at: now })
    .in("id", loanIds);

  if (loanError) return { error: loanError.message };

  // Update equipment statuses back to available (only if no other active loans)
  for (const eqId of equipmentIds) {
    const { data: otherLoans } = await supabaseAdmin
      .from("loans")
      .select("id")
      .eq("equipment_id", eqId)
      .in("status", ["active", "overdue"]);

    if (!otherLoans || otherLoans.length === 0) {
      await supabaseAdmin
        .from("equipment")
        .update({ status: "available", updated_at: now })
        .eq("id", eqId);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/equipment");
  revalidatePath("/borrow");
  revalidatePath("/admin");
  revalidatePath("/history");
  return { success: true, count: loans.length };
}