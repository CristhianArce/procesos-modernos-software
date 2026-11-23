import { IconoEstado } from "@/modulos/ui/IconoEstado";
import { ESTADOS, ORDEN_ESTADOS } from "@/modulos/ui/estado";
import { TIPOS_NODO } from "../schema";
import { SimboloNodo, TIPO } from "./SimboloNodo";

/** Qué significa cada forma, color y línea del mímico. */
export function LeyendaMimico() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-tenue">
      <ul aria-label="Estados" className="flex flex-wrap gap-x-4 gap-y-1">
        {ORDEN_ESTADOS.map((e) => (
          <li key={e} data-estado={e} className="flex items-center gap-1.5 text-[var(--sc-estado)]">
            <IconoEstado estado={e} tamano={12} />
            <span className="text-tenue">{ESTADOS[e].etiqueta}</span>
          </li>
        ))}
      </ul>
      <ul aria-label="Símbolos" className="flex flex-wrap gap-x-4 gap-y-1">
        {TIPOS_NODO.map((t) => (
          <li key={t} className="flex items-center gap-1.5 capitalize">
            <svg viewBox="-26 -26 52 52" width="18" height="18" aria-hidden="true" className="mimico-nodo text-tenue" data-estado="neutro">
              <SimboloNodo tipo={t} />
            </svg>
            {TIPO[t]}
          </li>
        ))}
      </ul>
      <span className="flex items-center gap-1.5">
        <svg width="28" height="8" aria-hidden="true">
          <line x1="2" y1="4" x2="26" y2="4" className="mimico-enlace" strokeWidth="3" />
          <line x1="2" y1="4" x2="26" y2="4" className="mimico-flujo" strokeWidth="2" />
        </svg>
        Flujo de energía
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="28" height="8" aria-hidden="true">
          <line x1="2" y1="4" x2="26" y2="4" className="mimico-enlace" data-activo="false" strokeWidth="2" />
        </svg>
        Sin flujo (desconectado)
      </span>
    </div>
  );
}
