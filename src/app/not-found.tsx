import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Car className="size-16 text-primary/30" />
      <h1 className="mt-6 text-4xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Página no encontrada
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        La página que buscas no existe o fue eliminada.
      </p>
      <Button asChild className="mt-6 bg-primary text-primary-foreground">
        <Link href="/">Volver al inicio</Link>
      </Button>
      <p className="mt-8 text-xs text-muted-foreground">
        {APP_NAME} — Venezuela
      </p>
    </div>
  );
}
