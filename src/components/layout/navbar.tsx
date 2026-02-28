"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Car, Menu, X } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface Props {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const solid = !transparent || scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className={`rounded-lg p-1.5 transition-colors ${solid ? "bg-primary" : "bg-white/20"}`}>
            <Car className={`size-5 ${solid ? "text-white" : "text-white"}`} />
          </div>
          <span className={`text-xl font-bold tracking-tight transition-colors ${
            solid ? "text-primary" : "text-white"
          }`}>
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/catalogo"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              solid ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white"
            }`}
          >
            Vehículos
          </Link>
          <Link
            href="/#como-funciona"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              solid ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white"
            }`}
          >
            Cómo funciona
          </Link>
          <Link
            href="/#precios"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              solid ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white"
            }`}
          >
            Precios
          </Link>

          <div className="ml-2 h-6 w-px bg-border/50" />

          <Link
            href="/login"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              solid ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white"
            }`}
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/dashboard/publish"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-accent/90 hover:shadow-lg"
          >
            Publicar mi carro
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`rounded-lg p-2 md:hidden transition-colors ${
            solid ? "text-foreground hover:bg-secondary" : "text-white hover:bg-white/10"
          }`}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 pb-4 pt-2 shadow-lg md:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            <Link
              href="/catalogo"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Vehículos
            </Link>
            <Link
              href="/#como-funciona"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Cómo funciona
            </Link>
            <Link
              href="/#precios"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Precios
            </Link>
            <div className="my-2 h-px bg-border" />
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/dashboard/publish"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              Publicar mi carro
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
