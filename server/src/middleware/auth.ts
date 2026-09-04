import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import type { AppConfig } from "../config";
import {
  credentialsMatch,
  SESSION_COOKIE,
  verifySessionToken,
} from "../auth/session";

function parseBasicAuth(header: string | undefined): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function isPublicPath(path: string): boolean {
  return path === "/login";
}

export function createAuthMiddleware(config: AppConfig): MiddlewareHandler {
  return async (c, next) => {
    if (!config.auth.enabled) {
      return next();
    }

    const path = new URL(c.req.url).pathname;
    if (isPublicPath(path)) {
      return next();
    }

    const basic = parseBasicAuth(c.req.header("Authorization"));
    if (
      basic &&
      credentialsMatch(basic.username, basic.password, config.auth.username, config.auth.password)
    ) {
      return next();
    }

    const session = getCookie(c, SESSION_COOKIE);
    if (session && verifySessionToken(session, config.auth.username, config.auth.secret)) {
      return next();
    }

    if (path.startsWith("/api/")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.redirect("/login");
  };
}
