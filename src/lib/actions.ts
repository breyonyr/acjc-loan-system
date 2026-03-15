"use server";

import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { actionError, ErrorCode, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const MAX_ITEMS_PER_BORROW = 20;

// ─── Rate limit helper ──────────────────────────────────
function checkRateLimit(userId: string): { success: false; error: string; code: ErrorCode } | null {
  const { allowed } = rateLimit(`action:${userId}`, 10, 60_000);
  if (!allowed) {
    return { success: false, error: "Too many requests. Please wait a moment before trying again.", code: ErrorCode.RATE_LIMITED };
  }
  return null;
}

// ─── Revalidate common paths ────────────────────────────
function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/equipment");
  revalidatePath("/borrow");
  revalidatePath("/admin");
  revalidatePath("/admin/equipment");
  revalidatePath("/admin/users");
  revalidatePath("/history");
}

// ─── Bulk release equipment helper ──────────────────────
// Replaces the old N+1 per-equipment loop with two bulk queries.
async function bulkReleaseEquipment(equipmentIds: string[]) {
  if (equipmentIds.length === 0) return;

  const now = new Date().toISOString();

  // Find which of these equipment IDs still have other active loans
  const { data: stillActive } = await supabaseAdmin
    .from("loans")
    .select("equipment_id")
    .in("equipment_id", equipmentIds)
    .in("status", ["active", "overdue"]);

  const busyIds = new Set((stillActive || []).map((l) => l.equipment_id));
  const toRelease = equipmentIds.filter((id) => !busyIds.has(id));

  if (toRelease.length > 0) {
    await supabaseAdmin
      .from("equipment")
      .update({ status: "available", updated_at: now })
      .in("id", toRelease);
  }
}

// ─── UUID validation ────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

// ─── Equipment Actions (Admin) ───────────────────────────

export async function createEquipment(formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can manage equipment.");
  }

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const image_url = formData.get("image_url") as string;

  if (!name?.trim()) {
    return actionError(ErrorCode.VALIDATION_ERROR, "Equipment name is required.");
  }

  const { error } = await supabaseAdmin.from("equipment").insert({
    name: name.trim(),
    description: description || null,
    category: category || null,
    image_url: image_url || null,
    qr_code: crypto.randomUUID(),
    status: "available",
  });

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to create equipment. Please try again.");

  revalidateAll();
  return { success: true };
}

export async function updateEquipment(id: string, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can manage equipment.");
  }

  if (!isValidUUID(id)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid equipment ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const image_url = formData.get("image_url") as string;
  const status = formData.get("status") as string;

  if (!name?.trim()) {
    return actionError(ErrorCode.VALIDATION_ERROR, "Equipment name is required.");
  }

  const { error } = await supabaseAdmin
    .from("equipment")
    .update({
      name: name.trim(),
      description: description || null,
      category: category || null,
      image_url: image_url || null,
      status: status || "available",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to update equipment. Please try again.");

  revalidateAll();
  return { success: true };
}

export async function deleteEquipment(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can manage equipment.");
  }

  if (!isValidUUID(id)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid equipment ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const { error } = await supabaseAdmin
    .from("equipment")
    .delete()
    .eq("id", id);

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to delete equipment. Please try again.");

  revalidateAll();
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
}): Promise<ActionResult<{ count: number }>> {
  const user = await getUser();
  if (!user) return actionError(ErrorCode.UNAUTHORIZED, "Not authenticated.");

  if (user.status === "banned") {
    return actionError(ErrorCode.UNAUTHORIZED, "Your account has been suspended. Contact an admin.");
  }

  if (user.status === "pending") {
    return actionError(ErrorCode.UNAUTHORIZED, "Your account is awaiting approval from a teacher.");
  }

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  if (equipmentIds.length === 0 && customItems.length === 0) {
    return actionError(ErrorCode.VALIDATION_ERROR, "No items selected.");
  }

  // Max items limit
  if (equipmentIds.length + customItems.length > MAX_ITEMS_PER_BORROW) {
    return actionError(ErrorCode.VALIDATION_ERROR, `You can borrow up to ${MAX_ITEMS_PER_BORROW} items at a time.`);
  }

  // Validate UUIDs
  for (const id of equipmentIds) {
    if (!isValidUUID(id)) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Invalid equipment ID.");
    }
  }

  // Validate dates server-side
  const now = new Date();
  const loanDateObj = new Date(loanDate);
  const dueDateObj = new Date(dueDate);

  if (isNaN(loanDateObj.getTime()) || isNaN(dueDateObj.getTime())) {
    return actionError(ErrorCode.VALIDATION_ERROR, "Invalid date format.");
  }

  // Loan date must be within ±1 day of today
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (Math.abs(loanDateObj.getTime() - now.getTime()) > oneDayMs * 2) {
    return actionError(ErrorCode.VALIDATION_ERROR, "Loan date must be within 1 day of today.");
  }

  // Due date must be after loan date
  if (dueDateObj <= loanDateObj) {
    return actionError(ErrorCode.VALIDATION_ERROR, "Due date must be after the loan date.");
  }

  // Due date must be within 90 days
  if (dueDateObj.getTime() - loanDateObj.getTime() > oneDayMs * 90) {
    return actionError(ErrorCode.VALIDATION_ERROR, "Loan period cannot exceed 90 days.");
  }

  for (const item of customItems) {
    if (!item.name?.trim()) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Custom item name cannot be empty.");
    }
    if (item.name.trim().length > 100) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Custom item name is too long (max 100 characters).");
    }
    if (item.quantity < 1 || item.quantity > 99) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Quantity must be between 1 and 99.");
    }
  }

  const batchId = crypto.randomUUID();
  const checkedOutAt = new Date().toISOString();

  // --- Validate inventory items ---
  let inventoryLoans: Record<string, unknown>[] = [];
  if (equipmentIds.length > 0) {
    const { data: items } = await supabaseAdmin
      .from("equipment")
      .select("id, name, status")
      .in("id", equipmentIds);

    if (!items || items.length !== equipmentIds.length) {
      return actionError(ErrorCode.NOT_FOUND, "Some items were not found.");
    }

    const unavailable = items.filter((i) => i.status !== "available");
    if (unavailable.length > 0) {
      return actionError(
        ErrorCode.CONFLICT,
        `${unavailable.map((i) => i.name).join(", ")} ${unavailable.length === 1 ? "is" : "are"} no longer available.`
      );
    }

    inventoryLoans = equipmentIds.map((equipmentId) => ({
      user_id: user.id,
      equipment_id: equipmentId,
      custom_item_name: null,
      custom_item_quantity: null,
      checked_out_at: checkedOutAt,
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
    checked_out_at: checkedOutAt,
    due_date: dueDate,
    status: "active" as const,
    notes: notes || null,
    batch_id: batchId,
  }));

  // --- Batch insert all loans ---
  const allLoans = [...inventoryLoans, ...customLoans];
  const { error: loanError } = await supabaseAdmin.from("loans").insert(allLoans);
  if (loanError) return actionError(ErrorCode.DATABASE_ERROR, "Failed to create loans. Please try again.");

  // --- Update equipment statuses (only for inventory items) ---
  if (equipmentIds.length > 0) {
    const { error: equipError } = await supabaseAdmin
      .from("equipment")
      .update({ status: "checked_out", updated_at: new Date().toISOString() })
      .in("id", equipmentIds);
    if (equipError) return actionError(ErrorCode.DATABASE_ERROR, "Failed to update equipment status. Please try again.");
  }

  revalidateAll();
  return { success: true, count: allLoans.length };
}

export async function returnEquipment(loanId: string): Promise<ActionResult<{ equipmentName: string }>> {
  const user = await getUser();
  if (!user) return actionError(ErrorCode.UNAUTHORIZED, "Not authenticated.");

  if (user.status === "banned") {
    return actionError(ErrorCode.UNAUTHORIZED, "Your account has been suspended.");
  }

  if (!isValidUUID(loanId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid loan ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  // Find the loan — any authenticated user can return on behalf of another
  const { data: loan } = await supabaseAdmin
    .from("loans")
    .select("*, equipment(name)")
    .eq("id", loanId)
    .in("status", ["active", "overdue"])
    .maybeSingle();

  if (!loan) return actionError(ErrorCode.NOT_FOUND, "Loan not found or already returned.");

  // Update loan — track who actually returned it
  const { error: loanError } = await supabaseAdmin
    .from("loans")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
      returned_by: user.id,
    })
    .eq("id", loanId);

  if (loanError) return actionError(ErrorCode.DATABASE_ERROR, "Failed to return item. Please try again.");

  // Only update equipment status if this is an inventory item
  if (loan.equipment_id) {
    await bulkReleaseEquipment([loan.equipment_id]);
  }

  revalidateAll();
  const displayName = loan.equipment?.name || loan.custom_item_name || "item";
  return { success: true, equipmentName: displayName };
}

export async function returnBatch(batchId: string): Promise<ActionResult<{ count: number }>> {
  const user = await getUser();
  if (!user) return actionError(ErrorCode.UNAUTHORIZED, "Not authenticated.");

  if (user.status === "banned") {
    return actionError(ErrorCode.UNAUTHORIZED, "Your account has been suspended.");
  }

  if (!isValidUUID(batchId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid batch ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  // Find all active loans in this batch
  const { data: loans } = await supabaseAdmin
    .from("loans")
    .select("id, equipment_id, status, user_id")
    .eq("batch_id", batchId)
    .in("status", ["active", "overdue"]);

  if (!loans || loans.length === 0) {
    return actionError(ErrorCode.NOT_FOUND, "No active loans found in this batch.");
  }

  const loanIds = loans.map((l) => l.id);
  const equipmentIds = loans
    .map((l) => l.equipment_id)
    .filter((id): id is string => id !== null);

  // Mark all loans as returned — track who returned them
  const now = new Date().toISOString();
  const { error: loanError } = await supabaseAdmin
    .from("loans")
    .update({ status: "returned", returned_at: now, returned_by: user.id })
    .in("id", loanIds);

  if (loanError) return actionError(ErrorCode.DATABASE_ERROR, "Failed to return items. Please try again.");

  // Bulk release equipment (replaces old N+1 loop)
  await bulkReleaseEquipment(equipmentIds);

  revalidateAll();
  return { success: true, count: loans.length };
}

// ─── User Management Actions (Admin) ────────────────────

export async function banUser(userId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can manage users.");
  }

  if (!isValidUUID(userId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid user ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  // Verify target user exists and is not an admin
  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return actionError(ErrorCode.NOT_FOUND, "User not found.");
  if (targetUser.role === "admin") {
    return actionError(ErrorCode.VALIDATION_ERROR, "Cannot ban an admin user.");
  }
  if (targetUser.status === "banned") {
    return actionError(ErrorCode.CONFLICT, "User is already banned.");
  }

  // Ban the user
  const { error: banError } = await supabaseAdmin
    .from("users")
    .update({ status: "banned" })
    .eq("id", userId);

  if (banError) return actionError(ErrorCode.DATABASE_ERROR, "Failed to ban user. Please try again.");

  // Force-return all their active loans
  const { data: activeLoans } = await supabaseAdmin
    .from("loans")
    .select("id, equipment_id")
    .eq("user_id", userId)
    .in("status", ["active", "overdue"]);

  if (activeLoans && activeLoans.length > 0) {
    const now = new Date().toISOString();
    const loanIds = activeLoans.map((l) => l.id);
    const equipmentIds = activeLoans
      .map((l) => l.equipment_id)
      .filter((id): id is string => id !== null);

    await supabaseAdmin
      .from("loans")
      .update({ status: "returned", returned_at: now })
      .in("id", loanIds);

    // Bulk release equipment (replaces old N+1 loop)
    await bulkReleaseEquipment(equipmentIds);
  }

  revalidateAll();
  return { success: true };
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can manage users.");
  }

  if (!isValidUUID(userId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid user ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id, status")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return actionError(ErrorCode.NOT_FOUND, "User not found.");
  if (targetUser.status === "active") {
    return actionError(ErrorCode.CONFLICT, "User is not banned.");
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "active" })
    .eq("id", userId);

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to unban user. Please try again.");

  revalidateAll();
  return { success: true };
}

export async function promoteToAdmin(userId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can promote users.");
  }

  if (!isValidUUID(userId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid user ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return actionError(ErrorCode.NOT_FOUND, "User not found.");
  if (targetUser.role === "admin") {
    return actionError(ErrorCode.CONFLICT, "User is already an admin.");
  }
  if (targetUser.status !== "active") {
    return actionError(ErrorCode.VALIDATION_ERROR, "Only active users can be promoted.");
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to promote user. Please try again.");

  revalidateAll();
  return { success: true };
}

export async function demoteToStudent(userId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can demote users.");
  }

  if (!isValidUUID(userId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid user ID.");
  if (userId === user.id) {
    return actionError(ErrorCode.VALIDATION_ERROR, "You cannot demote yourself.");
  }

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return actionError(ErrorCode.NOT_FOUND, "User not found.");
  if (targetUser.role !== "admin") {
    return actionError(ErrorCode.CONFLICT, "User is not an admin.");
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ role: "student" })
    .eq("id", userId);

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to demote user. Please try again.");

  revalidateAll();
  return { success: true };
}

// ─── Delete Loan Action (Admin) ─────────────────────────

export async function deleteLoan(loanId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can delete loans.");
  }

  if (!isValidUUID(loanId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid loan ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  // Fetch the loan
  const { data: loan } = await supabaseAdmin
    .from("loans")
    .select("id, equipment_id, status")
    .eq("id", loanId)
    .maybeSingle();

  if (!loan) return actionError(ErrorCode.NOT_FOUND, "Loan not found.");

  // Delete the loan
  const { error } = await supabaseAdmin
    .from("loans")
    .delete()
    .eq("id", loanId);

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to delete loan. Please try again.");

  // If loan was active and had equipment, release it
  if (loan.equipment_id && (loan.status === "active" || loan.status === "overdue")) {
    await bulkReleaseEquipment([loan.equipment_id]);
  }

  revalidateAll();
  return { success: true };
}

// ─── Delete User Action (Admin) ─────────────────────────

export async function deleteUser(userId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can delete users.");
  }

  if (!isValidUUID(userId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid user ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return actionError(ErrorCode.NOT_FOUND, "User not found.");
  if (targetUser.role === "admin") {
    return actionError(ErrorCode.VALIDATION_ERROR, "Cannot delete an admin user.");
  }

  // Find all their loans and release active equipment
  const { data: userLoans } = await supabaseAdmin
    .from("loans")
    .select("id, equipment_id, status")
    .eq("user_id", userId);

  if (userLoans && userLoans.length > 0) {
    const equipmentToRelease = userLoans
      .filter((l) => l.equipment_id && (l.status === "active" || l.status === "overdue"))
      .map((l) => l.equipment_id)
      .filter((id): id is string => id !== null);

    await supabaseAdmin.from("loans").delete().eq("user_id", userId);

    // Bulk release equipment (replaces old N+1 loop)
    await bulkReleaseEquipment(equipmentToRelease);
  }

  const { error } = await supabaseAdmin.from("users").delete().eq("id", userId);
  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to delete user. Please try again.");

  revalidateAll();
  return { success: true };
}

// ─── Approve User Action (Admin) ────────────────────────

export async function approveUser(userId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can approve users.");
  }

  if (!isValidUUID(userId)) return actionError(ErrorCode.VALIDATION_ERROR, "Invalid user ID.");

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id, status")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) return actionError(ErrorCode.NOT_FOUND, "User not found.");
  if (targetUser.status === "active") {
    return actionError(ErrorCode.CONFLICT, "User is already approved.");
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "active" })
    .eq("id", userId);

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to approve user. Please try again.");

  revalidateAll();
  return { success: true };
}

// ─── Bulk Approve Users (Admin) ──────────────────────────

export async function bulkApproveUsers(): Promise<ActionResult<{ count: number }>> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can approve users.");
  }

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  // Count pending users first
  const { count } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (!count || count === 0) {
    return actionError(ErrorCode.NOT_FOUND, "No pending users to approve.");
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "active" })
    .eq("status", "pending");

  if (error) return actionError(ErrorCode.DATABASE_ERROR, "Failed to approve users. Please try again.");

  revalidateAll();
  return { success: true, count };
}

// ─── Toggle Approval Mode (Admin) ───────────────────────

export async function toggleApprovalMode(enabled: boolean): Promise<ActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return actionError(ErrorCode.UNAUTHORIZED, "Only admins can change settings.");
  }

  const rateLimited = checkRateLimit(user.id);
  if (rateLimited) return rateLimited;

  const { setSetting } = await import("@/lib/settings");
  await setSetting("approval_required", enabled ? "true" : "false");

  revalidateAll();
  return { success: true };
}
