import { ESTADOS, type Estado } from "./estado";
import { IconoEstado } from "./IconoEstado";

/** Forma + texto del estado, con el color del estado (nunca solo color). */
export function IndicadorEstado({ estado, etiqueta }: { estado: Estado; etiqueta?: string }) {
  return (
    <span data-estado={estado} className="inline-flex items-center gap-1.5 text-sm text-[var(--sc-estado)]">
      <IconoEstado estado={estado} />
      <span className="text-texto">{etiqueta ?? ESTADOS[estado].etiqueta}</span>
    </span>
  );
}
