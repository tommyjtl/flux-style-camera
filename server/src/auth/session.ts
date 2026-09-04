import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function credentialsMatch(
  username: string,
  password: string,
  expectedUser: string,
  expectedPass: string,
): boolean {
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

export function createSessionToken(username: string, secret: string): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${username}:${expiresAt}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${signature}`;
}

export function verifySessionToken(
  token: string,
  expectedUser: string,
  secret: string,
): boolean {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) return false;

  const [username, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (username !== expectedUser || !Number.isFinite(expiresAt)) return false;

  return Date.now() < expiresAt;
}

export const SESSION_COOKIE = "fluxoid_session";
