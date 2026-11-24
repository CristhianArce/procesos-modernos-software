import type { ReactNode } from "react";
import type { Estado } from "./estado";

export type Tono = Estado | "acento" | "neutro";

/** Etiqueta corta con borde y fondo del tono. */
export function Insignia({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <span
      data-tono={tono}
      className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--sc-estado)_45%,transparent)] bg-[color-mix(in_srgb,var(--sc-estado)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-[var(--sc-estado)]"
    >
      {children}
    </span>
  );
}
