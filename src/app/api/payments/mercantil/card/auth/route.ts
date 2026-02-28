import { NextResponse } from "next/server";
import { isMercantilConfigured } from "@/lib/payments/mercantil-auth";

export async function POST() {
  if (!isMercantilConfigured()) {
    return NextResponse.json(
      { error: "Tarjeta Nacional no disponible por el momento" },
      { status: 503 }
    );
  }

  // TODO: Implement when Mercantil credentials are available
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
