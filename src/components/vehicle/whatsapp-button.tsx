"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

interface Props {
  phone: string;
  brand: string;
  model: string;
  year: number;
}

export function WhatsAppButton({ phone, brand, model, year }: Props) {
  // Normalize phone: remove spaces, parentheses, dashes
  const cleanPhone = phone.replace(/[\s()\-+]/g, "");

  const message = encodeURIComponent(
    `Hola, me interesa tu ${brand} ${model} ${year} publicado en ${APP_NAME}. ¿Está disponible?`
  );

  const url = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <Button
      asChild
      size="lg"
      className="w-full bg-[#25D366] text-white hover:bg-[#1ebe57] text-base"
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-5" />
        Contactar por WhatsApp
      </a>
    </Button>
  );
}
