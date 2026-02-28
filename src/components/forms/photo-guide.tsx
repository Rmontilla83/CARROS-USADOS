"use client";

import { useState } from "react";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Sun,
  Droplets,
  Sparkles,
} from "lucide-react";

const PHOTO_ANGLES = [
  { number: 1, label: "Frontal completo", tip: "De frente, centrado, mostrando todo el frente del vehículo" },
  { number: 2, label: "Trasera completa", tip: "Desde atrás, centrado, mostrando toda la parte trasera" },
  { number: 3, label: "Lateral izquierdo", tip: "Desde el lado del conductor, mostrando todo el lateral" },
  { number: 4, label: "Lateral derecho", tip: "Desde el lado del copiloto, mostrando todo el lateral" },
  { number: 5, label: "Interior tablero/volante", tip: "Desde el asiento del conductor, mostrando tablero completo" },
  { number: 6, label: "Interior asientos traseros", tip: "Desde la puerta trasera, mostrando el espacio interior" },
  { number: 7, label: "Motor (capó abierto)", tip: "Con el capó abierto, mostrando el motor limpio" },
  { number: 8, label: "Llantas/rines", tip: "Primer plano de una llanta mostrando el estado del caucho y rin" },
];

const TIPS = [
  { icon: Sun, text: "Buena iluminación: exterior, día nublado o sombra uniforme es ideal" },
  { icon: Droplets, text: "Carro limpio: lava tu carro antes de fotografiar" },
  { icon: Sparkles, text: "Sin objetos personales: retira todo del interior antes de las fotos" },
  { icon: Camera, text: "Fondo despejado: estacionamiento vacío o calle sin mucho tráfico" },
];

export function PhotoGuide() {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">
            Cómo tomar buenas fotos de tu carro
          </span>
        </div>
        {open ? (
          <ChevronUp className="size-4 text-blue-600" />
        ) : (
          <ChevronDown className="size-4 text-blue-600" />
        )}
      </button>

      {open && (
        <div className="border-t border-blue-200 p-4 space-y-4">
          {/* 8 recommended angles */}
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
              8 ángulos recomendados
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PHOTO_ANGLES.map((angle) => (
                <div
                  key={angle.number}
                  className="rounded-lg bg-white p-2.5 text-center"
                >
                  <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {angle.number}
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {angle.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                    {angle.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
              Tips para mejores fotos
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TIPS.map((tip) => (
                <div
                  key={tip.text}
                  className="flex items-start gap-2 rounded-lg bg-white p-2.5"
                >
                  <tip.icon className="size-4 shrink-0 text-blue-600 mt-0.5" />
                  <span className="text-xs text-muted-foreground">
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
