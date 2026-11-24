import { Icono } from "@/modulos/ui/Icono";

/** Nombre de la red que opera el tablero (demostración: la semilla está en el Valle de Aburrá). */
export const NOMBRE_RED = "Red de distribución Valle de Aburrá";

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-sc border border-acento/40 bg-acento/10 text-acento">
        <Icono nombre="rayo" tamano={18} />
      </span>
      {!compacta && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-wide text-texto">SCADA · Sensores</span>
          <span className="block text-xs text-tenue max-lg:hidden">{NOMBRE_RED}</span>
        </span>
      )}
    </span>
  );
}
