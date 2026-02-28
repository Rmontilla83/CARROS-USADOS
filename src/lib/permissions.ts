import type { UserRole } from "@/types";

export const INTERNAL_ROLES: UserRole[] = [
  "admin",
  "analyst",
  "moderator",
  "printer",
  "courier",
  "support",
];

export function isInternalRole(role: string): boolean {
  return INTERNAL_ROLES.includes(role as UserRole);
}

export function canViewDashboard(role: UserRole): boolean {
  return role === "admin" || role === "analyst";
}

export function canViewVehicles(role: UserRole): boolean {
  return (
    role === "admin" ||
    role === "analyst" ||
    role === "moderator" ||
    role === "support"
  );
}

export function canModerateVehicles(role: UserRole): boolean {
  return role === "admin" || role === "moderator";
}

export function canEditAnyVehicle(role: UserRole): boolean {
  return role === "admin";
}

export function canViewQrOrders(role: UserRole): boolean {
  return role === "admin" || role === "printer" || role === "courier";
}

export function canPrintQrOrders(role: UserRole): boolean {
  return role === "admin" || role === "printer";
}

export function canAssignCourier(role: UserRole): boolean {
  return role === "admin" || role === "printer";
}

export function canMarkDelivered(role: UserRole): boolean {
  return role === "admin" || role === "courier";
}

export function canViewUsers(role: UserRole): boolean {
  return role === "admin" || role === "analyst" || role === "support";
}

export function canChangeRoles(role: UserRole): boolean {
  return role === "admin";
}

export function canViewPayments(role: UserRole): boolean {
  return role === "admin" || role === "analyst" || role === "support";
}

export function canApprovePayments(role: UserRole): boolean {
  return role === "admin" || role === "support";
}

export function canViewChangelog(role: UserRole): boolean {
  return isInternalRole(role);
}

export function getDefaultAdminRoute(role: UserRole): string {
  switch (role) {
    case "admin":
    case "analyst":
      return "/admin";
    case "moderator":
      return "/admin/vehicles";
    case "printer":
    case "courier":
      return "/admin/qr-orders";
    case "support":
      return "/admin/payments";
    default:
      return "/dashboard";
  }
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badgeCount?: number;
  isNew?: boolean;
}

export function getNavItems(
  role: UserRole,
  counts?: {
    pendingVehicles?: number;
    pendingQr?: number;
    assignedToMe?: number;
    pendingPayments?: number;
    changelogCount?: number;
  }
): NavItem[] {
  const items: NavItem[] = [];

  if (canViewDashboard(role)) {
    items.push({ href: "/admin", label: "Dashboard", icon: "LayoutDashboard" });
  }

  if (canViewVehicles(role)) {
    items.push({
      href: "/admin/vehicles",
      label: "Publicaciones",
      icon: "Car",
      badgeCount:
        role === "moderator" || role === "admin"
          ? counts?.pendingVehicles
          : undefined,
    });
  }

  if (canViewPayments(role)) {
    items.push({
      href: "/admin/payments",
      label: "Pagos",
      icon: "CreditCard",
      badgeCount:
        role === "support" || role === "admin"
          ? counts?.pendingPayments
          : undefined,
    });
  }

  if (canViewQrOrders(role)) {
    items.push({
      href: "/admin/qr-orders",
      label: "Impresión y Entregas",
      icon: "QrCode",
      badgeCount:
        role === "courier"
          ? counts?.assignedToMe
          : role === "printer" || role === "admin"
            ? counts?.pendingQr
            : undefined,
    });
  }

  if (canViewUsers(role)) {
    items.push({ href: "/admin/users", label: "Usuarios", icon: "Users" });
  }

  if (canViewChangelog(role)) {
    items.push({
      href: "/admin/changelog",
      label: "Novedades",
      icon: "FileText",
      badgeCount: counts?.changelogCount,
    });
  }

  return items;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  analyst: "Analista",
  moderator: "Moderador",
  printer: "Impresor",
  courier: "Motorizado",
  support: "Soporte",
  seller: "Vendedor",
};

export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700 border-red-300",
  analyst: "bg-purple-100 text-purple-700 border-purple-300",
  moderator: "bg-blue-100 text-blue-700 border-blue-300",
  printer: "bg-orange-100 text-orange-700 border-orange-300",
  courier: "bg-green-100 text-green-700 border-green-300",
  support: "bg-yellow-100 text-yellow-700 border-yellow-300",
  seller: "bg-gray-100 text-gray-600 border-gray-300",
};
