/**
 * Mercantil Card Payment with AES encryption.
 * Stub implementation: ready for when credentials arrive.
 */

import { createCipheriv, randomBytes } from "crypto";
import { getMercantilToken, isMercantilConfigured } from "./mercantil-auth";

const MERCANTIL_CARD_URL = "https://api.mercantilbanco.com/payments/v1/card";

interface CardAuthParams {
  amount: number;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  holderName: string;
  paymentId: string;
}

interface CardAuthResult {
  transactionId: string;
  status: "pending" | "authenticated" | "failed";
  redirectUrl?: string;
}

interface CardPayResult {
  transactionId: string;
  status: "completed" | "failed";
  completedAt?: string;
}

function encryptCardData(data: string): { encrypted: string; iv: string } {
  const key = process.env.MERCANTIL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("MERCANTIL_ENCRYPTION_KEY not configured");
  }

  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  return { encrypted, iv: iv.toString("base64") };
}

export async function authenticateCard(params: CardAuthParams): Promise<CardAuthResult> {
  if (!isMercantilConfigured()) {
    throw new Error("Mercantil not configured");
  }

  const token = await getMercantilToken();

  const cardData = JSON.stringify({
    card_number: params.cardNumber,
    expiry_month: params.expiryMonth,
    expiry_year: params.expiryYear,
    cvv: params.cvv,
  });

  const { encrypted, iv } = encryptCardData(cardData);

  const res = await fetch(`${MERCANTIL_CARD_URL}/authenticate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Merchant-Id": process.env.MERCANTIL_MERCHANT_ID!,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: "VES",
      encrypted_card: encrypted,
      iv,
      holder_name: params.holderName,
      reference: params.paymentId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Card auth failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status,
    redirectUrl: data.redirect_url,
  };
}

export async function processCardPayment(transactionId: string): Promise<CardPayResult> {
  if (!isMercantilConfigured()) {
    throw new Error("Mercantil not configured");
  }

  const token = await getMercantilToken();

  const res = await fetch(`${MERCANTIL_CARD_URL}/pay/${transactionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Merchant-Id": process.env.MERCANTIL_MERCHANT_ID!,
    },
  });

  if (!res.ok) {
    throw new Error(`Card payment failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status,
    completedAt: data.completed_at,
  };
}
