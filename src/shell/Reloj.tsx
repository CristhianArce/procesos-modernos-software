"use client";

import { useSyncExternalStore } from "react";
import { horaBogota } from "./hora";

function suscribir(avisar: () => void) {
  const id = setInterval(avisar, 1000);
  return () => clearInterval(id);
}

// Mismo texto durante el mismo segundo: React solo vuelve a pintar cuando cambia.
const hora = () => horaBogota(Date.now());
const sinHora = () => "--:--:--"; // en el servidor: evita un desajuste de hidratación

export function Reloj() {
  const texto = useSyncExternalStore(suscribir, hora, sinHora);
  return (
    <time className="cifra text-sm text-texto" aria-label={`Hora de Bogotá ${texto}`}>
      {texto}
    </time>
  );
}
