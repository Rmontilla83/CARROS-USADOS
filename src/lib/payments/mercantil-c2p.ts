/**
 * Mercantil C2P (Comercio a Persona) — Pago Móvil.
 * Customer provides phone, bank, and cedula. They confirm the payment
 * on their banking app, then we poll for status.
 */

import { getC2PConfig, signPayload, isMercantilC2PConfigured } from "./mercantil-auth";

export { isMercantilC2PConfigured };

interface C2PCreateParams {
  amountVes: number;
  phone: string;
  bankCode: string;
  cedula: string;
  paymentId: string;
}

export interface C2PCreateResult {
  transactionId: string;
  status: "pending" | "completed" | "failed";
}

export interface C2PStatusResult {
  transactionId: string;
  status: "pending" | "completed" | "failed";
  completedAt?: string;
}

/**
 * Create a C2P (Pago Móvil) charge.
 * The customer will receive a push notification to confirm the payment.
 */
export async function createC2PCharge(params: C2PCreateParams): Promise<C2PCreateResult> {
  const config = getC2PConfig();

  const body = {
    client_id: config.clientId,
    merchant_id: config.merchantId,
    amount: params.amountVes.toFixed(2),
    currency: "VES",
    phone: params.phone,
    bank_code: params.bankCode,
    id_number: params.cedula,
    reference: params.paymentId,
  };

  const payload = JSON.stringify(body);
  const signature = signPayload(payload, config.cipherKey);

  const res = await fetch(`${config.apiUrl}/c2p/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": config.clientId,
      "X-Signature": signature,
    },
    body: payload,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Mercantil C2P charge error:", res.status, errorBody);
    throw new Error(`C2P charge failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status ?? "pending",
  };
}

/**
 * Check the status of a C2P charge.
 */
export async function checkC2PStatus(transactionId: string): Promise<C2PStatusResult> {
  const config = getC2PConfig();

  const signature = signPayload(transactionId, config.cipherKey);

  const res = await fetch(`${config.apiUrl}/c2p/charges/${transactionId}`, {
    headers: {
      "X-Client-Id": config.clientId,
      "X-Signature": signature,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Mercantil C2P status error:", res.status, errorBody);
    throw new Error(`C2P status check failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status,
    completedAt: data.completed_at,
  };
}
