/**
 * Mercantil Débito Inmediato.
 * Stub implementation: ready for when credentials arrive.
 */

import { getMercantilToken, isMercantilConfigured } from "./mercantil-auth";

const MERCANTIL_DEBIT_URL = "https://api.mercantilbanco.com/payments/v1/debit";

interface DebitCreateParams {
  amount: number;
  bankCode: string;
  accountNumber: string;
  cedula: string;
  paymentId: string;
}

interface DebitCreateResult {
  transactionId: string;
  status: "pending" | "completed" | "failed";
  authUrl?: string;
}

interface DebitStatusResult {
  transactionId: string;
  status: "pending" | "completed" | "failed";
  completedAt?: string;
}

export async function createDebitCharge(params: DebitCreateParams): Promise<DebitCreateResult> {
  if (!isMercantilConfigured()) {
    throw new Error("Mercantil not configured");
  }

  const token = await getMercantilToken();

  const res = await fetch(`${MERCANTIL_DEBIT_URL}/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Merchant-Id": process.env.MERCANTIL_MERCHANT_ID!,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: "VES",
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      cedula: params.cedula,
      reference: params.paymentId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Debit charge failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status,
    authUrl: data.auth_url,
  };
}

export async function checkDebitStatus(transactionId: string): Promise<DebitStatusResult> {
  if (!isMercantilConfigured()) {
    throw new Error("Mercantil not configured");
  }

  const token = await getMercantilToken();

  const res = await fetch(`${MERCANTIL_DEBIT_URL}/charges/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Merchant-Id": process.env.MERCANTIL_MERCHANT_ID!,
    },
  });

  if (!res.ok) {
    throw new Error(`Debit status check failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    transactionId: data.transaction_id,
    status: data.status,
    completedAt: data.completed_at,
  };
}
