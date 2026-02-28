"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Car,
  QrCode,
  Users,
  LogOut,
  Menu,
  X,
  Home,
  FileText,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getNavItems, ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/permissions";
import type { UserRole } from "@/types";
import changelog from "@/data/changelog.json";

// Count entries from releases in the last 7 days
const recentEntryCount = changelog
  .filter((r) => Date.now() - new Date(r.date).getTime() < 7 * 24 * 60 * 60 * 1000)
  .reduce((sum, r) => sum + r.entries.length, 0);

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Car,
  QrCode,
  Users,
  FileText,
  CreditCard,
};

interface Props {
  userName: string;
  userEmail: string;
  userRole: UserRole;
  counts: {
    pendingVehicles: number;
    pendingQr: number;
    assignedToMe: number;
    pendingPayments: number;
  };
}

export function AdminSidebar({ userName, userEmail, userRole, counts }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const navItems = getNavItems(userRole, {
    ...counts,
    changelogCount: recentEntryCount,
  });

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const navContent = (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-3 py-2 group">
        <div className="rounded-lg bg-primary p-1.5 transition-transform group-hover:scale-110">
          <Shield className="size-5 text-white" />
        </div>
        <span className="text-lg font-bold text-primary">Admin Panel</span>
      </Link>

      {/* Nav links */}
      <nav className="mt-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const IconComponent = ICON_MAP[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {IconComponent && <IconComponent className="size-4 shrink-0" />}
              {item.label}
              {item.isNew && (
                <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Nuevo
                </span>
              )}
              {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {item.badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to dashboard / home */}
      <div className="mt-6 border-t border-border pt-4">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LayoutDashboard className="size-4 shrink-0" />
          Dashboard de Vendedor
        </Link>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Home className="size-4 shrink-0" />
          Ir a la página principal
        </Link>
      </div>

      {/* User info + sign out at bottom */}
      <div className="mt-auto border-t border-border pt-4">
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {userName}
            </p>
            <Badge className={`border text-[10px] px-1.5 py-0 ${ROLE_BADGE_COLORS[userRole]}`}>
              {ROLE_LABELS[userRole]}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-white p-4 lg:flex">
        {navContent}
      </aside>

      {/* Mobile header with hamburger */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-64 flex-col p-4">
            <SheetHeader className="sr-only">
              <SheetTitle>Menú de administración</SheetTitle>
            </SheetHeader>
            {navContent}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-lg font-bold text-primary">
          <div className="rounded-lg bg-primary p-1">
            <Shield className="size-4 text-white" />
          </div>
          Admin
        </div>
      </header>
    </>
  );
}
