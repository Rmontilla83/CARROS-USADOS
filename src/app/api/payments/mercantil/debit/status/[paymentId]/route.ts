import { NextResponse } from "next/server";
import { isMercantilDebitConfigured } from "@/lib/payments/mercantil-debit";

export async function GET() {
  if (!isMercantilDebitConfigured()) {
    return NextResponse.json(
      { error: "Débito Inmediato no disponible por el momento" },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
