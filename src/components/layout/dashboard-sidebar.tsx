"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  LayoutDashboard,
  Plus,
  CreditCard,
  LogOut,
  Menu,
  X,
  Home,
  Shield,
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
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

interface Props {
  userName: string;
  userEmail: string;
  userRole?: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "Mis Vehículos", icon: Car },
  { href: "/dashboard/publish", label: "Publicar Vehículo", icon: Plus },
  { href: "/dashboard/payments", label: "Pagos", icon: CreditCard },
];

export function DashboardSidebar({ userName, userEmail, userRole }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const navContent = (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-3 py-2 group">
        <div className="rounded-lg bg-accent p-1.5 transition-transform group-hover:scale-110">
          <Car className="size-5 text-white" />
        </div>
        <span className="text-lg font-bold text-primary">{APP_NAME}</span>
      </Link>

      {/* Nav links */}
      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
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
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to home + Admin link */}
      <div className="mt-6 border-t border-border pt-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Home className="size-4 shrink-0" />
          Ir a la página principal
        </Link>
        {userRole === "admin" && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <Shield className="size-4 shrink-0" />
            Panel Admin
          </Link>
        )}
      </div>

      {/* User info + sign out at bottom */}
      <div className="mt-auto border-t border-border pt-4">
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {userName}
          </p>
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
              <SheetTitle>Menú de navegación</SheetTitle>
            </SheetHeader>
            {navContent}
          </SheetContent>
        </Sheet>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-bold text-primary"
        >
          <div className="rounded-lg bg-accent p-1">
            <Car className="size-4 text-white" />
          </div>
          {APP_NAME}
        </Link>
      </header>
    </>
  );
}
