import Link from "next/link";
import { Car } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#0f2d42] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-lg bg-accent p-1.5">
                <Car className="size-5 text-white" />
              </div>
              <span className="text-xl font-bold">{APP_NAME}</span>
            </Link>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              La plataforma de venta de vehículos usados con QR inteligente.
              Tu carro es tu mejor vitrina.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              Plataforma
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/catalogo" className="text-sm text-white/70 hover:text-white transition-colors">
                  Ver vehículos
                </Link>
              </li>
              <li>
                <Link href="/dashboard/publish" className="text-sm text-white/70 hover:text-white transition-colors">
                  Publicar mi carro
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="text-sm text-white/70 hover:text-white transition-colors">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/#precios" className="text-sm text-white/70 hover:text-white transition-colors">
                  Precios
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              Cuenta
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-white/70 hover:text-white transition-colors">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition-colors">
                  Mi dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              Legal y Seguridad
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/terminos" className="text-sm text-white/70 hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/seguridad" className="text-sm text-white/70 hover:text-white transition-colors">
                  Recomendaciones de Seguridad
                </Link>
              </li>
              <li className="text-sm text-white/70">
                Barcelona · Puerto La Cruz · Lechería
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-white/40">
            Hecho con orgullo en Venezuela 🇻🇪
          </p>
        </div>
      </div>
    </footer>
  );
}
