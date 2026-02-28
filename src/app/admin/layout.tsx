import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import type { Profile } from "@/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "full_name" | "email" | "role"> | null;

  if (!typedProfile || typedProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const displayName =
    typedProfile.full_name || user.user_metadata?.full_name || user.email || "";

  return (
    <div className="min-h-screen bg-secondary">
      <AdminSidebar
        userName={displayName}
        userEmail={user.email || ""}
      />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
