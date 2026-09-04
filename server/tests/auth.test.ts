import { describe, expect, test } from "bun:test";
import { createTestContext } from "./helpers";

describe("basic auth", () => {
  test("redirects unauthenticated browser requests to /login", async () => {
    const ctx = await createTestContext({
      configOverrides: {
        auth: {
          enabled: true,
          username: "tommy",
          password: "secret-pass",
          secret: "signing-secret",
          secureCookies: false,
        },
        staticDir: "/tmp/unused",
      },
    });

    try {
      const response = await ctx.app.request("/");
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/login");
    } finally {
      await ctx.cleanup();
    }
  });

  test("shows login failed on bad credentials", async () => {
    const ctx = await createTestContext({
      configOverrides: {
        auth: {
          enabled: true,
          username: "tommy",
          password: "secret-pass",
          secret: "signing-secret",
          secureCookies: false,
        },
      },
    });

    try {
      const response = await ctx.app.request("/login", {
        method: "POST",
        body: new URLSearchParams({
          username: "tommy",
          password: "wrong",
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/login?failed=1");
    } finally {
      await ctx.cleanup();
    }
  });

  test("sets session cookie and allows API access after login", async () => {
    const ctx = await createTestContext({
      configOverrides: {
        auth: {
          enabled: true,
          username: "tommy",
          password: "secret-pass",
          secret: "signing-secret",
          secureCookies: false,
        },
      },
    });

    try {
      const login = await ctx.app.request("/login", {
        method: "POST",
        body: new URLSearchParams({
          username: "tommy",
          password: "secret-pass",
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      expect(login.status).toBe(302);
      const cookie = login.headers.get("Set-Cookie");
      expect(cookie).toContain("fluxoid_session=");

      const health = await ctx.app.request("/api/health", {
        headers: { Cookie: cookie ?? "" },
      });
      expect(health.status).toBe(200);
    } finally {
      await ctx.cleanup();
    }
  });

  test("returns 401 for API requests without credentials", async () => {
    const ctx = await createTestContext({
      configOverrides: {
        auth: {
          enabled: true,
          username: "tommy",
          password: "secret-pass",
          secret: "signing-secret",
          secureCookies: false,
        },
      },
    });

    try {
      const response = await ctx.app.request("/api/health");
      expect(response.status).toBe(401);
    } finally {
      await ctx.cleanup();
    }
  });
});
