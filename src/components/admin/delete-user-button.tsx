"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/lib/actions/admin";

interface Props {
  userId: string;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = confirm(
      `¿Estás seguro de eliminar a "${userName || "este usuario"}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setLoading(true);
    const result = await deleteUser(userId);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Error al eliminar usuario");
    }

    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleDelete}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive"
      title="Eliminar usuario"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
    </Button>
  );
}
