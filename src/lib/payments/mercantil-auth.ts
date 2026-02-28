/**
 * Mercantil authentication and request signing utilities.
 * Separate configuration checks per product (Card vs C2P).
 */

import { createHmac } from "crypto";

// ─── Card (Botón de Pagos) ───

export function isMercantilCardConfigured(): boolean {
  return !!(
    process.env.MERCANTIL_CARD_CLIENT_ID &&
    process.env.MERCANTIL_CARD_AFFILIATE_CODE &&
    process.env.MERCANTIL_CARD_CIPHER_KEY &&
    process.env.MERCANTIL_CARD_API_URL
  );
}

export function getCardConfig() {
  if (!isMercantilCardConfigured()) {
    throw new Error("Mercantil Card credentials not configured");
  }
  return {
    clientId: process.env.MERCANTIL_CARD_CLIENT_ID!,
    affiliateCode: process.env.MERCANTIL_CARD_AFFILIATE_CODE!,
    cipherKey: process.env.MERCANTIL_CARD_CIPHER_KEY!,
    apiUrl: process.env.MERCANTIL_CARD_API_URL!,
  };
}

// ─── C2P (Pago Móvil) ───

export function isMercantilC2PConfigured(): boolean {
  return !!(
    process.env.MERCANTIL_C2P_CLIENT_ID &&
    process.env.MERCANTIL_C2P_MERCHANT_ID &&
    process.env.MERCANTIL_C2P_CIPHER_KEY &&
    process.env.MERCANTIL_C2P_API_URL
  );
}

export function getC2PConfig() {
  if (!isMercantilC2PConfigured()) {
    throw new Error("Mercantil C2P credentials not configured");
  }
  return {
    clientId: process.env.MERCANTIL_C2P_CLIENT_ID!,
    merchantId: process.env.MERCANTIL_C2P_MERCHANT_ID!,
    cipherKey: process.env.MERCANTIL_C2P_CIPHER_KEY!,
    apiUrl: process.env.MERCANTIL_C2P_API_URL!,
  };
}

// ─── Shared utilities ───

/**
 * HMAC-SHA256 signature for Mercantil API requests.
 */
export function signPayload(payload: string, cipherKey: string): string {
  return createHmac("sha256", cipherKey).update(payload).digest("hex");
}
