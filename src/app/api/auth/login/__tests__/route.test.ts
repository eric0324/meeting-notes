// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "test-secret-at-least-32-characters-long");
vi.stubEnv("SHARED_PASSWORD", "correct-password");

const { POST } = await import("../route");

describe("POST /api/auth/login", () => {
  it("returns 200 and sets cookie for correct password", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "correct-password" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("meeting_token=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("returns 401 for wrong password", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("密碼錯誤");
  });

  it("returns 400 for missing password", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
