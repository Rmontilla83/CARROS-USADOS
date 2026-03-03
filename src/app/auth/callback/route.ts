import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates/welcome";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email to new users (profile created < 1 min ago)
      sendWelcomeIfNew(supabase).catch((err) =>
        console.error("Welcome email error:", err)
      );
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

async function sendWelcomeIfNew(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) return;

  // Only send if profile was created less than 2 minutes ago (new signup)
  const createdAt = new Date(profile.created_at).getTime();
  const isNew = Date.now() - createdAt < 2 * 60 * 1000;
  if (!isNew) return;

  const { subject, html } = welcomeEmail(profile.full_name || "Usuario");
  await sendEmail(profile.email, subject, html);
}
