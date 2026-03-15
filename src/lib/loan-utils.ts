import type { Loan } from "@/lib/types";
import { format } from "date-fns";

export function getLoanItemName(loan: Loan): string {
  if (loan.equipment?.name) return loan.equipment.name;
  if (loan.custom_item_name) {
    const qty = loan.custom_item_quantity;
    return qty && qty > 1
      ? `${loan.custom_item_name} (x${qty})`
      : loan.custom_item_name;
  }
  return "Unknown item";
}

/**
 * Get the best checkout timestamp for a loan.
 * `checked_out_at` is often T00:00:00 (no real time), so we fall back
 * to `created_at` which always has the real Supabase insertion time.
 */
export function getCheckoutTime(loan: Loan): Date {
  const checkedOut = new Date(loan.checked_out_at);
  // If checked_out_at is midnight UTC, use created_at instead
  if (
    checkedOut.getUTCHours() === 0 &&
    checkedOut.getUTCMinutes() === 0 &&
    checkedOut.getUTCSeconds() === 0 &&
    loan.created_at
  ) {
    return new Date(loan.created_at);
  }
  return checkedOut;
}

/** Format a checkout timestamp with time. */
export function formatCheckoutDate(loan: Loan, compact = false): string {
  const d = getCheckoutTime(loan);
  if (compact) {
    return format(d, "MMM d, h:mm a");
  }
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

/** Short readable loan ID from UUID, e.g. "#LN-4F2A" */
export function getShortLoanId(id: string): string {
  return `#LN-${id.slice(0, 4).toUpperCase()}`;
}
