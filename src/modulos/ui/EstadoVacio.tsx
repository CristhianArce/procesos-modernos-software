import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono";

type Props = { titulo: string; children?: ReactNode; accion?: ReactNode; icono?: NombreIcono };

/** Pantalla o bloque sin datos todavía: qué falta y qué hacer. */
export function EstadoVacio({ titulo, children, accion, icono = "nodos" }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-acento/10 text-acento">
        <Icono nombre={icono} tamano={24} />
      </span>
      <h2 className="text-base font-semibold text-texto">{titulo}</h2>
      {children && <p className="text-sm text-tenue">{children}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
