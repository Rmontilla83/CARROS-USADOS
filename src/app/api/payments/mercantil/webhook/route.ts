import { NextResponse } from "next/server";
import { isMercantilConfigured } from "@/lib/payments/mercantil-auth";

export async function POST() {
  if (!isMercantilConfigured()) {
    return NextResponse.json(
      { error: "Mercantil webhook not configured" },
      { status: 503 }
    );
  }

  // TODO: Implement webhook verification and payment processing
  // when Mercantil credentials are available
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
