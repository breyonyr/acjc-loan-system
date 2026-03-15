import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  // Use unique keys per test to avoid interference
  let testKey: string;

  beforeEach(() => {
    testKey = `test-${Date.now()}-${Math.random()}`;
  });

  it("allows requests under the limit", () => {
    const result = rateLimit(testKey, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks remaining count correctly", () => {
    rateLimit(testKey, 5, 60_000);
    rateLimit(testKey, 5, 60_000);
    const result = rateLimit(testKey, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests at the limit", () => {
    for (let i = 0; i < 3; i++) {
      rateLimit(testKey, 3, 60_000);
    }
    const result = rateLimit(testKey, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses separate limits per key", () => {
    const key1 = `${testKey}-a`;
    const key2 = `${testKey}-b`;

    // Max out key1
    for (let i = 0; i < 2; i++) {
      rateLimit(key1, 2, 60_000);
    }

    // key2 should still be allowed
    const result = rateLimit(key2, 2, 60_000);
    expect(result.allowed).toBe(true);

    // key1 should be blocked
    const result2 = rateLimit(key1, 2, 60_000);
    expect(result2.allowed).toBe(false);
  });
});
