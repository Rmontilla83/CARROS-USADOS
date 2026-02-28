import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

type ProfileRow = Pick<
  Profile,
  "id" | "full_name" | "email" | "city" | "role" | "created_at"
>;

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  seller: { label: "Vendedor", className: "bg-gray-100 text-gray-600 border-gray-300" },
  admin: { label: "Admin", className: "bg-primary/15 text-primary border-primary/30" },
  printer: { label: "Impresor", className: "bg-purple-100 text-purple-700 border-purple-300" },
  courier: { label: "Motorizado", className: "bg-orange-100 text-orange-700 border-orange-300" },
};

export async function AdminUserTable() {
  const supabase = await createClient();

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, city, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const typedProfiles = (profiles as ProfileRow[]) || [];

  // Count vehicles per user
  const userIds = typedProfiles.map((p) => p.id);
  const { data: vehicleCounts } = userIds.length > 0
    ? await supabase
        .from("vehicles")
        .select("user_id")
        .in("user_id", userIds)
    : { data: [] };

  const countMap = new Map<string, number>();
  if (vehicleCounts) {
    for (const v of vehicleCounts as { user_id: string }[]) {
      countMap.set(v.user_id, (countMap.get(v.user_id) || 0) + 1);
    }
  }

  if (typedProfiles.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No hay usuarios registrados.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Vehículos</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedProfiles.map((user) => {
              const roleCfg = ROLE_CONFIG[user.role];
              return (
                <TableRow key={user.id}>
                  <TableCell className="text-sm font-medium text-foreground">
                    {user.full_name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.city || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border text-[11px] ${roleCfg.className}`}>
                      {roleCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {countMap.get(user.id) || 0}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("es-VE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border lg:hidden">
        {typedProfiles.map((user) => {
          const roleCfg = ROLE_CONFIG[user.role];
          return (
            <div key={user.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.full_name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge className={`shrink-0 border text-[11px] ${roleCfg.className}`}>
                  {roleCfg.label}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {user.city || "Sin ciudad"} ·{" "}
                  {countMap.get(user.id) || 0} vehículo
                  {(countMap.get(user.id) || 0) !== 1 ? "s" : ""}
                </span>
                <span>
                  {new Date(user.created_at).toLocaleDateString("es-VE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
