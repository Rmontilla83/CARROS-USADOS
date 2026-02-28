/**
 * Mercantil Botón de Pagos — Card payment (redirect flow).
 * Similar to Stripe Checkout: creates an order and redirects to Mercantil's
 * hosted payment page. Customer enters card details on Mercantil's secure page.
 */

import { getCardConfig, signPayload, isMercantilCardConfigured } from "./mercantil-auth";

export { isMercantilCardConfigured };

interface CardOrderParams {
  amountVes: number;
  paymentId: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

interface CardOrderResult {
  orderId: string;
  paymentUrl: string;
}

interface CardVerifyResult {
  transactionId: string;
  status: "completed" | "failed" | "pending";
  amount: number;
  reference: string;
}

/**
 * Create a card payment order on Mercantil's Botón de Pagos.
 * Returns a URL to redirect the customer to.
 */
export async function createCardOrder(params: CardOrderParams): Promise<CardOrderResult> {
  const config = getCardConfig();

  const body = {
    client_id: config.clientId,
    affiliate_code: config.affiliateCode,
    amount: params.amountVes.toFixed(2),
    currency: "VES",
    description: params.description,
    reference: params.paymentId,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
  };

  const payload = JSON.stringify(body);
  const signature = signPayload(payload, config.cipherKey);

  const res = await fetch(`${config.apiUrl}/button-payment/orders`, {
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
    console.error("Mercantil Card order error:", res.status, errorBody);
    throw new Error(`Card order failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    orderId: data.order_id,
    paymentUrl: data.payment_url,
  };
}

/**
 * Verify a card payment callback from Mercantil.
 * Called when the customer returns from Mercantil's payment page.
 */
export function verifyCardCallback(
  queryParams: Record<string, string>,
  expectedSignature: string
): CardVerifyResult | null {
  const config = getCardConfig();

  // Build verification payload from query params
  const verificationString = [
    queryParams.order_id,
    queryParams.transaction_id,
    queryParams.status,
    queryParams.amount,
    queryParams.reference,
  ].join("|");

  const computedSignature = signPayload(verificationString, config.cipherKey);

  if (computedSignature !== expectedSignature) {
    console.error("Mercantil Card callback signature mismatch");
    return null;
  }

  return {
    transactionId: queryParams.transaction_id,
    status: queryParams.status as "completed" | "failed" | "pending",
    amount: parseFloat(queryParams.amount),
    reference: queryParams.reference,
  };
}
