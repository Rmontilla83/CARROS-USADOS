"use client";

import { MessageCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface Props {
  phone: string;
  brand: string;
  model: string;
  year: number;
}

export function WhatsAppButton({ phone, brand, model, year }: Props) {
  const cleanPhone = phone.replace(/[\s()\-+]/g, "");

  const message = encodeURIComponent(
    `Hola, me interesa tu ${brand} ${model} ${year} publicado en ${APP_NAME}. ¿Está disponible?`
  );

  const url = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-4 text-base font-bold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:bg-[#1ebe57] hover:shadow-xl active:scale-[0.98]"
    >
      <MessageCircle className="size-5" />
      Contactar por WhatsApp
    </a>
  );
}
