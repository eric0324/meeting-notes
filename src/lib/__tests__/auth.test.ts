// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "test-secret-at-least-32-characters-long");
vi.stubEnv("SHARED_PASSWORD", "correct-password");

const { verifyPassword, createToken, verifyToken } = await import(
  "@/lib/auth"
);

describe("auth", () => {
  describe("verifyPassword", () => {
    it("returns true for correct password", () => {
      expect(verifyPassword("correct-password")).toBe(true);
    });

    it("returns false for wrong password", () => {
      expect(verifyPassword("wrong-password")).toBe(false);
    });

    it("returns false for empty password", () => {
      expect(verifyPassword("")).toBe(false);
    });
  });

  describe("createToken / verifyToken", () => {
    it("creates a valid JWT token", async () => {
      const token = await createToken();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("verifies a valid token", async () => {
      const token = await createToken();
      const result = await verifyToken(token);
      expect(result).toBe(true);
    });

    it("rejects an invalid token", async () => {
      const result = await verifyToken("invalid.token.here");
      expect(result).toBe(false);
    });

    it("rejects an empty token", async () => {
      const result = await verifyToken("");
      expect(result).toBe(false);
    });
  });
});
