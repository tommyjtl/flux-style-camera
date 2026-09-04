import type { AppConfig } from "../config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function buildGoogleAuthUrl(config: AppConfig, state: string): string {
  const redirectUri = `${config.appBaseUrl}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  config: AppConfig,
  code: string,
): Promise<{ email: string }> {
  const redirectUri = `${config.appBaseUrl}/api/auth/google/callback`;
  const body = new URLSearchParams({
    code,
    client_id: config.googleClientId,
    client_secret: config.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenResponse.ok) {
    throw new Error("Google token exchange failed");
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Google token missing");
  }

  const userResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error("Google userinfo failed");
  }

  const user = (await userResponse.json()) as { email?: string; email_verified?: boolean };
  if (!user.email || !user.email_verified) {
    throw new Error("Google account email not verified");
  }

  return { email: user.email.toLowerCase() };
}
