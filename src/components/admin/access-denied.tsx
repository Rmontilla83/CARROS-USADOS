import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  defaultRoute: string;
}

export function AccessDenied({ defaultRoute }: Props) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldAlert className="size-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-foreground">
        No tienes acceso a esta sección
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Tu rol actual no tiene permisos para ver esta página. Contacta al
        administrador si crees que esto es un error.
      </p>
      <Button asChild className="mt-6">
        <Link href={defaultRoute}>Ir a mi panel</Link>
      </Button>
    </div>
  );
}
