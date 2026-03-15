import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted for proper mock hoisting
const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/auth", () => ({
  getUser: () => mockGetUser(),
}));

import {
  createEquipment,
  deleteEquipment,
  borrowEquipment,
  returnEquipment,
  returnBatch,
} from "@/lib/actions";

describe("Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── createEquipment ──────────────────────────────────
  describe("createEquipment", () => {
    it("rejects non-admin users", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "student" });

      const formData = new FormData();
      formData.set("name", "Test Item");
      const result = await createEquipment(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("rejects unauthenticated users", async () => {
      mockGetUser.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("name", "Test Item");
      const result = await createEquipment(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("rejects empty name", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "admin" });

      const formData = new FormData();
      formData.set("name", "  ");
      const result = await createEquipment(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("succeeds for admin with valid data", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "admin" });
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const formData = new FormData();
      formData.set("name", "Microphone");
      formData.set("description", "SM58");
      formData.set("category", "audio");
      formData.set("image_url", "");

      const result = await createEquipment(formData);
      expect(result.success).toBe(true);
    });
  });

  // ─── deleteEquipment ──────────────────────────────────
  describe("deleteEquipment", () => {
    it("rejects non-admin users", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "student" });
      const result = await deleteEquipment("eq-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("succeeds for admin", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "admin" });
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await deleteEquipment("eq-1");
      expect(result.success).toBe(true);
    });
  });

  // ─── borrowEquipment ──────────────────────────────────
  describe("borrowEquipment", () => {
    it("rejects unauthenticated users", async () => {
      mockGetUser.mockResolvedValue(null);
      const result = await borrowEquipment({
        equipmentIds: ["eq-1"],
        customItems: [],
        loanDate: "2024-01-01T00:00:00",
        dueDate: "2024-01-05T23:59:59",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });

    it("rejects empty selection", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "student" });
      const result = await borrowEquipment({
        equipmentIds: [],
        customItems: [],
        loanDate: "2024-01-01T00:00:00",
        dueDate: "2024-01-05T23:59:59",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("validates custom item name length", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "student" });
      const result = await borrowEquipment({
        equipmentIds: [],
        customItems: [{ name: "a".repeat(101), quantity: 1 }],
        loanDate: "2024-01-01T00:00:00",
        dueDate: "2024-01-05T23:59:59",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });

    it("validates custom item quantity range", async () => {
      mockGetUser.mockResolvedValue({ id: "1", role: "student" });
      const result = await borrowEquipment({
        equipmentIds: [],
        customItems: [{ name: "Item", quantity: 100 }],
        loanDate: "2024-01-01T00:00:00",
        dueDate: "2024-01-05T23:59:59",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  // ─── returnEquipment ──────────────────────────────────
  describe("returnEquipment", () => {
    it("rejects unauthenticated users", async () => {
      mockGetUser.mockResolvedValue(null);
      const result = await returnEquipment("loan-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });
  });

  // ─── returnBatch ──────────────────────────────────────
  describe("returnBatch", () => {
    it("rejects unauthenticated users", async () => {
      mockGetUser.mockResolvedValue(null);
      const result = await returnBatch("batch-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
