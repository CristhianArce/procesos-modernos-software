"use client";

import { EstadoError } from "@/modulos/ui/EstadoError";

// Si una pantalla del tablero falla (por ejemplo, la BD no responde), el shell sigue y se ofrece reintentar.
// El detalle técnico no se muestra: queda en los logs del servidor.
export default function ErrorTablero({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <EstadoError onReintentar={reset} />;
}
