import Link from "next/link";
import type { Rol } from "@/lib/session";
import { Icono } from "@/modulos/ui/Icono";
import { BotonSalir } from "./BotonSalir";
import { EstadoConexion, type Conexion } from "./EstadoConexion";
import { Marca } from "./marca";
import { Reloj } from "./Reloj";

const ROL = { administrador: "Administrador", tecnico: "Técnico" } as const satisfies Record<Rol, string>;

type Props = { rol: Rol; alertasActivas: number; conexion: Conexion };

export function BarraSuperior({ rol, alertasActivas, conexion }: Props) {
  const tono = alertasActivas > 0 ? "critico" : "normal";
  return (
    <header className="col-span-2 flex h-14 items-center gap-4 border-b border-borde bg-fondo-2/90 px-4 backdrop-blur">
      <Marca />
      <div className="ml-auto flex items-center gap-5 whitespace-nowrap max-lg:gap-3">
        <EstadoConexion conexion={conexion} />
        <Reloj />
        <Link
          href="/dashboard#alarmas"
          data-tono={tono}
          className="inline-flex items-center gap-1.5 rounded-sc border border-[color-mix(in_srgb,var(--sc-estado)_45%,transparent)] bg-[color-mix(in_srgb,var(--sc-estado)_12%,transparent)] px-2.5 py-1 text-sm text-[var(--sc-estado)] hover:bg-[color-mix(in_srgb,var(--sc-estado)_20%,transparent)]"
        >
          <Icono nombre="alarma" tamano={16} />
          <span className="cifra font-semibold">{alertasActivas}</span>
          <span className="max-lg:sr-only">{alertasActivas === 1 ? "alerta activa" : "alertas activas"}</span>
        </Link>
        <span className="flex items-center gap-2 border-l border-borde pl-4 text-sm text-tenue max-lg:pl-3">
          <Icono nombre="usuario" tamano={18} />
          <span className="max-lg:sr-only">{ROL[rol]}</span>
          <BotonSalir />
        </span>
      </div>
    </header>
  );
}
