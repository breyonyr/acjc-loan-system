export interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: "student" | "admin";
  status: "active" | "banned" | "pending";
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  status: "available" | "checked_out" | "maintenance";
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  equipment_id: string | null;
  custom_item_name: string | null;
  custom_item_quantity: number | null;
  checked_out_at: string;
  due_date: string;
  returned_at: string | null;
  returned_by: string | null;
  status: "active" | "returned" | "overdue";
  notes: string | null;
  batch_id: string | null;
  created_at: string;
  // Joined fields
  equipment?: Equipment;
  user?: User;
  returned_by_user?: User;
}

// Client-side cart item for the borrow form
export type CartItem =
  | { type: "inventory"; equipmentId: string; name: string; description: string | null; category: string | null }
  | { type: "custom"; name: string; quantity: number };
