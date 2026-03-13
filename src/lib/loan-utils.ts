import type { Loan } from "@/lib/types";

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

/** Short readable loan ID from UUID, e.g. "#LN-4F2A" */
export function getShortLoanId(id: string): string {
  return `#LN-${id.slice(0, 4).toUpperCase()}`;
}
