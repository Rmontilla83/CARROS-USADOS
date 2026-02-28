import Link from "next/link";
import { Car, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary to-white px-4">
      <div className="rounded-2xl bg-primary/10 p-4">
        <Car className="size-12 text-primary" />
      </div>
      <h1 className="mt-6 text-6xl font-extrabold text-foreground">404</h1>
      <p className="mt-2 text-lg font-medium text-foreground">
        Página no encontrada
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        La página que buscas no existe o fue eliminada.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>
      <p className="mt-10 text-xs text-muted-foreground">
        {APP_NAME} — Venezuela
      </p>
    </div>
  );
}
