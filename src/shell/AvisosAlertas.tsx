"use client";

import { severidad, type AlertaReciente } from "@/modulos/estado/alarmas";
import { useEstadoVivo } from "@/modulos/estado/ui/EstadoVivo";
import { UNIDAD } from "@/modulos/dashboard/formato";
import { cifraConUnidad } from "@/modulos/ui/formato";
import { IconoEstado } from "@/modulos/ui/IconoEstado";

const MAX_VISIBLES = 3;

/** Pila de avisos de alertas nuevas; presentacional para poder probarla sin el sondeo. */
export function ListaAvisos({ avisos, onCerrar }: { avisos: AlertaReciente[]; onCerrar: (id: string) => void }) {
  const visibles = avisos.slice(0, MAX_VISIBLES);
  return (
    <div role="status" aria-live="polite" aria-label="Avisos de alertas" className="pointer-events-none fixed top-16 right-4 z-50 flex w-80 flex-col gap-2">
      {visibles.map((a) => {
        const s = severidad(a);
        return (
          <div
            key={a.id}
            data-estado={s.nivel === "alta" ? "critico" : "advertencia"}
            className="aviso pointer-events-auto flex gap-3 rounded-sc-lg border border-[color-mix(in_srgb,var(--sc-estado)_55%,transparent)] bg-panel/95 p-3 shadow-sc backdrop-blur"
          >
            <span className="mt-0.5 text-[var(--sc-estado)]">
              <IconoEstado estado={s.nivel === "alta" ? "critico" : "advertencia"} tamano={16} />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-texto">Nueva alerta · {a.nodoNombre}</p>
              <p className="truncate text-tenue">{a.sensorNombre}</p>
              <p className="cifra mt-0.5 text-xs text-texto">
                {`${a.magnitud} ${cifraConUnidad(a.valor, UNIDAD[a.magnitud])} > umbral ${cifraConUnidad(a.umbral, UNIDAD[a.magnitud])} (+${Math.round(s.exceso * 100)} %)`}
              </p>
            </div>
            <button type="button" className="boton-fantasma -mt-1 -mr-1 size-7 min-w-7" aria-label={`Cerrar aviso de ${a.sensorNombre}`} onClick={() => onCerrar(a.id)}>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        );
      })}
      {avisos.length > MAX_VISIBLES && <p className="pointer-events-auto text-right text-xs text-tenue">{`y ${avisos.length - MAX_VISIBLES} más en el panel de alarmas`}</p>}
    </div>
  );
}

export function AvisosAlertas() {
  const { nuevas, cerrarAviso } = useEstadoVivo();
  return <ListaAvisos avisos={nuevas} onCerrar={cerrarAviso} />;
}
