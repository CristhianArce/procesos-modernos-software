import type { Rol } from "@/lib/session";
import { Icono } from "@/modulos/ui/Icono";
import { BotonSalir } from "./BotonSalir";
import { AlertasVivas, ConexionViva } from "./IndicadoresVivos";
import { Marca } from "./marca";
import { Reloj } from "./Reloj";

const ROL = { administrador: "Administrador", tecnico: "Técnico" } as const satisfies Record<Rol, string>;

/** Barra superior: red, conexión y alertas en vivo, reloj y usuario. Va dentro de ProveedorEstadoVivo. */
export function BarraSuperior({ rol }: { rol: Rol }) {
  return (
    <header className="col-span-2 flex h-14 items-center gap-4 border-b border-borde bg-fondo-2/90 px-4 backdrop-blur">
      <Marca />
      <div className="ml-auto flex items-center gap-5 whitespace-nowrap max-lg:gap-3">
        <ConexionViva />
        <Reloj />
        <AlertasVivas />
        <span className="flex items-center gap-2 border-l border-borde pl-4 text-sm text-tenue max-lg:pl-3">
          <Icono nombre="usuario" tamano={18} />
          <span className="max-lg:sr-only">{ROL[rol]}</span>
          <BotonSalir />
        </span>
      </div>
    </header>
  );
}
