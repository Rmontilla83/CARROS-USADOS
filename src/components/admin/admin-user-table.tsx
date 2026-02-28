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
import {
  canChangeRoles,
  canDeleteUsers,
  isInternalRole,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
} from "@/lib/permissions";
import { UserRoleSelect } from "./user-role-select";
import { DeleteUserButton } from "./delete-user-button";
import type { UserTab } from "./user-tabs";
import type { Profile, UserRole } from "@/types";

interface Props {
  userRole: UserRole;
  currentUserId: string;
  tab: UserTab;
  query: string;
}

type ProfileRow = Pick<
  Profile,
  "id" | "full_name" | "email" | "city" | "role" | "created_at"
>;

export async function AdminUserTable({ userRole, currentUserId, tab, query }: Props) {
  const supabase = await createClient();
  const showRoleChanger = canChangeRoles(userRole);
  const showDelete = canDeleteUsers(userRole);

  // Base query
  let dbQuery = supabase
    .from("profiles")
    .select("id, full_name, email, city, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // Filter by tab
  if (tab === "team") {
    dbQuery = dbQuery.in("role", ["admin", "analyst", "moderator", "printer", "courier", "support"]);
  } else {
    dbQuery = dbQuery.eq("role", "seller");
  }

  // Search filter
  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data: profiles } = await dbQuery;
  const typedProfiles = (profiles as ProfileRow[]) || [];

  // Count vehicles per user (relevant for sellers tab, but useful for both)
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
      <div className="mt-4 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          {query
            ? "No se encontraron usuarios con esa búsqueda."
            : tab === "team"
              ? "No hay miembros del equipo."
              : "No hay vendedores registrados."}
        </p>
      </div>
    );
  }

  const isTeamTab = tab === "team";

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              {isTeamTab ? (
                <TableHead>Rol</TableHead>
              ) : (
                <TableHead>Ciudad</TableHead>
              )}
              <TableHead>Vehículos</TableHead>
              <TableHead>Registro</TableHead>
              {showDelete && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedProfiles.map((user) => {
              const badgeColor = ROLE_BADGE_COLORS[user.role] || ROLE_BADGE_COLORS.seller;
              const roleLabel = ROLE_LABELS[user.role] || user.role;
              const canDeleteThis = showDelete && user.id !== currentUserId;

              return (
                <TableRow key={user.id}>
                  <TableCell className="text-sm font-medium text-foreground">
                    {user.full_name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  {isTeamTab ? (
                    <TableCell>
                      {showRoleChanger ? (
                        <UserRoleSelect userId={user.id} currentRole={user.role} />
                      ) : (
                        <Badge className={`border text-[11px] ${badgeColor}`}>
                          {roleLabel}
                        </Badge>
                      )}
                    </TableCell>
                  ) : (
                    <TableCell className="text-sm text-muted-foreground">
                      {user.city || "—"}
                    </TableCell>
                  )}
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
                  {showDelete && (
                    <TableCell>
                      {canDeleteThis && (
                        <DeleteUserButton userId={user.id} userName={user.full_name} />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border lg:hidden">
        {typedProfiles.map((user) => {
          const badgeColor = ROLE_BADGE_COLORS[user.role] || ROLE_BADGE_COLORS.seller;
          const roleLabel = ROLE_LABELS[user.role] || user.role;
          const canDeleteThis = showDelete && user.id !== currentUserId;

          return (
            <div key={user.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {user.full_name || "—"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isTeamTab ? (
                    showRoleChanger ? (
                      <UserRoleSelect userId={user.id} currentRole={user.role} />
                    ) : (
                      <Badge className={`shrink-0 border text-[11px] ${badgeColor}`}>
                        {roleLabel}
                      </Badge>
                    )
                  ) : (
                    <Badge className={`shrink-0 border text-[11px] ${badgeColor}`}>
                      {roleLabel}
                    </Badge>
                  )}
                  {canDeleteThis && (
                    <DeleteUserButton userId={user.id} userName={user.full_name} />
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {isTeamTab
                    ? `${countMap.get(user.id) || 0} vehículo${(countMap.get(user.id) || 0) !== 1 ? "s" : ""}`
                    : `${user.city || "Sin ciudad"} · ${countMap.get(user.id) || 0} vehículo${(countMap.get(user.id) || 0) !== 1 ? "s" : ""}`}
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
