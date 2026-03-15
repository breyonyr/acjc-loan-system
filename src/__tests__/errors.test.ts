import { describe, it, expect } from "vitest";
import { actionError, ErrorCode, getErrorMessage } from "@/lib/errors";

describe("errors", () => {
  describe("actionError", () => {
    it("creates an error result with code and message", () => {
      const result = actionError(ErrorCode.UNAUTHORIZED, "Not allowed");
      expect(result).toEqual({
        success: false,
        error: "Not allowed",
        code: "UNAUTHORIZED",
      });
    });

    it("creates different error codes", () => {
      const result = actionError(ErrorCode.RATE_LIMITED, "Slow down");
      expect(result.success).toBe(false);
      expect(result.code).toBe("RATE_LIMITED");
    });
  });

  describe("getErrorMessage", () => {
    it("returns user-facing message for each error code", () => {
      expect(getErrorMessage(ErrorCode.UNAUTHORIZED)).toBeTruthy();
      expect(getErrorMessage(ErrorCode.NOT_FOUND)).toBeTruthy();
      expect(getErrorMessage(ErrorCode.VALIDATION_ERROR)).toBeTruthy();
      expect(getErrorMessage(ErrorCode.RATE_LIMITED)).toBeTruthy();
      expect(getErrorMessage(ErrorCode.DATABASE_ERROR)).toBeTruthy();
      expect(getErrorMessage(ErrorCode.CONFLICT)).toBeTruthy();
    });
  });
});
