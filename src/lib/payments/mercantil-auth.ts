/**
 * Mercantil OAuth2 authentication.
 * Returns cached token or fetches new one from Mercantil API.
 * All functions are stubs until MERCANTIL_CLIENT_ID and MERCANTIL_CLIENT_SECRET
 * environment variables are configured.
 */

const MERCANTIL_AUTH_URL = "https://api.mercantilbanco.com/auth/oauth/v2/token";

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isMercantilConfigured(): boolean {
  return !!(
    process.env.MERCANTIL_CLIENT_ID &&
    process.env.MERCANTIL_CLIENT_SECRET &&
    process.env.MERCANTIL_MERCHANT_ID
  );
}

export async function getMercantilToken(): Promise<string> {
  if (!isMercantilConfigured()) {
    throw new Error("Mercantil credentials not configured");
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(MERCANTIL_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.MERCANTIL_CLIENT_ID!,
      client_secret: process.env.MERCANTIL_CLIENT_SECRET!,
      scope: "payments",
    }),
  });

  if (!res.ok) {
    throw new Error(`Mercantil auth failed: ${res.status}`);
  }

  const data = await res.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}
