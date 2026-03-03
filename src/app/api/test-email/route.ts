import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates/welcome";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Falta ?to=email@ejemplo.com" }, { status: 400 });
  }

  const { subject, html } = welcomeEmail("Usuario de prueba");
  const result = await sendEmail(to, subject, html);

  return NextResponse.json(result);
}
