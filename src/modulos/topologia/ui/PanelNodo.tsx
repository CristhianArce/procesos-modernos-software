"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MAGNITUDES } from "@/modulos/alertas/magnitudes";
import { formatearFecha, TITULO, UNIDAD } from "@/modulos/dashboard/formato";
import type { DetalleNodo, SensorDetalle } from "@/modulos/estado/service";
import { cifraConUnidad } from "@/modulos/ui/formato";
import { IndicadorEstado } from "@/modulos/ui/IndicadorEstado";
import { Medidor } from "@/modulos/ui/Medidor";
import { Sparkline } from "@/modulos/ui/Sparkline";
import type { NodoMimico } from "../mimico";
import { TIPO } from "./SimboloNodo";

const UMBRAL = { voltaje: "umbralVoltaje", corriente: "umbralCorriente", potencia: "umbralPotencia" } as const;
const ETIQUETA = { voltaje: "Tensión", corriente: "Corriente", potencia: "Potencia" } as const;
const ALERTAS_VISIBLES = 5;

function Sensor({ s }: { s: SensorDetalle }) {
  const ultima = s.lecturas.at(-1);
  return (
    <section className="space-y-3 border-t border-borde pt-3">
      <h3 className="text-sm font-semibold text-texto">{s.nombre}</h3>
      {!ultima ? (
        <p className="text-sm text-tenue">Sin lecturas</p>
      ) : (
        MAGNITUDES.map((m) => (
          <div key={m} className="grid grid-cols-[minmax(0,1fr)_88px] items-end gap-3">
            <Medidor etiqueta={ETIQUETA[m]} valor={ultima[m]} umbral={s[UMBRAL[m]]} unidad={UNIDAD[m]} />
            <Sparkline
              valores={s.lecturas.map((l) => l[m])}
              etiqueta={`${TITULO[m]}: últimas lecturas de ${s.nombre}`}
              ancho={88}
              alto={30}
              className="mb-4 text-acento"
            />
          </div>
        ))
      )}
    </section>
  );
}

type PropsContenido = { nodo: NodoMimico; detalle: DetalleNodo | null; error: boolean; onCerrar: () => void };

/** Contenido del panel; presentacional para probarlo sin red. */
export function ContenidoPanelNodo({ nodo, detalle, error, onCerrar }: PropsContenido) {
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-borde p-4">
        <div className="min-w-0">
          <h2 id="panel-nodo-titulo" tabIndex={-1} className="truncate text-base font-semibold text-texto outline-none">
            {nodo.nombre}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-tenue">
            <span className="capitalize">{TIPO[nodo.tipo]}</span>
            <IndicadorEstado estado={nodo.nivel} />
          </p>
        </div>
        <button type="button" className="boton-fantasma" aria-label="Cerrar panel" title="Cerrar (Esc)" onClick={onCerrar}>
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {error ? (
          <p role="alert" className="text-sm text-critico">
            No se pudo cargar el detalle del nodo.
          </p>
        ) : !detalle ? (
          <p className="text-sm text-tenue" aria-busy="true">
            Cargando…
          </p>
        ) : (
          <>
            {detalle.sensores.length === 0 ? <p className="text-sm text-tenue">Este nodo no tiene sensores.</p> : detalle.sensores.map((s) => <Sensor key={s.id} s={s} />)}
            <section className="border-t border-borde pt-3">
              <h3 className="text-sm font-semibold text-texto">Alertas recientes</h3>
              {detalle.alertas.length === 0 ? (
                <p className="mt-1 text-sm text-tenue">Sin alertas</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {detalle.alertas.slice(0, ALERTAS_VISIBLES).map((a) => (
                    <li key={a.id} className="cifra text-xs">
                      <span className="text-tenue">{formatearFecha(a.creadaEn)}</span>
                      <br />
                      {`${a.sensorNombre} · ${a.magnitud} `}
                      <span className="text-critico">{cifraConUnidad(a.valor, UNIDAD[a.magnitud])}</span>
                      {` > ${cifraConUnidad(a.umbral, UNIDAD[a.magnitud])}`}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
      <footer className="border-t border-borde p-4">
        <Link href={`/nodos/${nodo.id}`} className="enlace text-sm font-medium">
          Ver ficha completa
        </Link>
      </footer>
    </>
  );
}

type Props = { nodo: NodoMimico; generadaEn: string; onCerrar: () => void };

/**
 * Panel lateral con el detalle de un nodo. Toma el foco al abrirse, Esc lo cierra y se actualiza con cada
 * instantánea (vuelve a pedir el detalle cuando cambia `generadaEn`).
 */
export function PanelNodo({ nodo, generadaEn, onCerrar }: Props) {
  const [carga, setCarga] = useState<{ id: string; detalle: DetalleNodo | null; error: boolean } | null>(null);
  const titulo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titulo.current?.querySelector<HTMLElement>("#panel-nodo-titulo")?.focus();
  }, [nodo.id]);

  useEffect(() => {
    const control = new AbortController();
    fetch(`/api/estado/nodos/${nodo.id}`, { cache: "no-store", signal: control.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((detalle: DetalleNodo) => setCarga({ id: nodo.id, detalle, error: false }))
      .catch((e) => {
        // Si falla una actualización se conserva el último detalle; si falla la primera carga se avisa.
        if (!control.signal.aborted) setCarga((c) => (c?.id === nodo.id && c.detalle ? c : { id: nodo.id, detalle: null, error: Boolean(e) }));
      });
    return () => control.abort();
  }, [nodo.id, generadaEn]);

  const esDeEste = carga?.id === nodo.id;
  const teclado = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCerrar();
    }
  };

  return (
    <div
      ref={titulo}
      role="region"
      aria-labelledby="panel-nodo-titulo"
      id="panel-nodo"
      onKeyDown={teclado}
      className="panel-nodo absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-borde-fuerte bg-panel/97 shadow-sc backdrop-blur"
    >
      <ContenidoPanelNodo nodo={nodo} detalle={esDeEste ? carga.detalle : null} error={esDeEste && carga.error} onCerrar={onCerrar} />
    </div>
  );
}
