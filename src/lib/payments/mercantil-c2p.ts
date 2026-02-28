/**
 * Mercantil C2P (Comercio a Persona) — Pago Móvil.
 * Stub implementation: ready for when credentials arrive.
 */

import { getMercantilToken, isMercantilConfigured } from "./mercantil-auth";

const MERCANTIL_C2P_URL = "https://api.mercantilbanco.com/payments/v1/c2p";

interface C2PCreateParams {
  amount: number;
  phone: string;
  bankCode: string;
  cedula: string;
  paymentId: string;
}

interface C2PCreateResult {
  transactionId: string;
  status: "pending" | "completed" | "failed";
}

interface C2PStatusResult {
  transactionId: string;
  status: "pending" | "completed" | "failed";
  completedAt?: string;
}

export async function createC2PCharge(params: C2PCreateParams): Promise<C2PCreateResult> {
  if (!isMercantilConfigured()) {
    throw new Error("Mercantil not configured");
  }

  const token = await getMercantilToken();

  const res = await fetch(`${MERCANTIL_C2P_URL}/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Merchant-Id": process.env.MERCANTIL_MERCHANT_ID!,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: "VES",
      phone: params.phone,
      bank_code: params.bankCode,
      cedula: params.cedula,
      reference: params.paymentId,
    }),
  });

  if (!res.ok) {
    throw new Error(`C2P charge failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status,
  };
}

export async function checkC2PStatus(transactionId: string): Promise<C2PStatusResult> {
  if (!isMercantilConfigured()) {
    throw new Error("Mercantil not configured");
  }

  const token = await getMercantilToken();

  const res = await fetch(`${MERCANTIL_C2P_URL}/charges/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Merchant-Id": process.env.MERCANTIL_MERCHANT_ID!,
    },
  });

  if (!res.ok) {
    throw new Error(`C2P status check failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status,
    completedAt: data.completed_at,
  };
}
