"use client";

import { useState } from "react";
import { MAGNITUDES, type Magnitud } from "@/modulos/alertas/magnitudes";
import { conUnidad, formatearFecha } from "@/modulos/dashboard/formato";
import { Insignia } from "@/modulos/ui/Insignia";
import { filtrarAlarmas, ordenarAlarmas, severidad, type AlertaReciente } from "../alarmas";
import { useEstadoVivo } from "./EstadoVivo";

/** Misma ventana que el servicio (VENTANA_ALERTAS_MIN): una alerta de los últimos 15 min sigue activa. */
const VENTANA_MS = 15 * 60 * 1000;

type Orden = "severidad" | "hora";

function Alarma({ a, activa }: { a: AlertaReciente; activa: boolean }) {
  const s = severidad(a);
  return (
    <li data-testid="alerta" data-id={a.id} className="grid gap-1 border-b border-borde/60 px-4 py-2.5 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <Insignia tono={s.nivel === "alta" ? "critico" : "advertencia"}>{`${s.nivel === "alta" ? "Alta" : "Media"} +${Math.round(s.exceso * 100)} %`}</Insignia>
        <span className="cifra text-xs text-tenue">
          {activa && <span className="mr-2 font-semibold text-critico">Activa</span>}
          {formatearFecha(a.creadaEn)}
        </span>
      </div>
      <p className="text-sm">
        <span className="font-medium text-texto">{a.nodoNombre}</span>
        <span className="text-tenue">{` · ${a.sensorNombre}`}</span>
      </p>
      <p className="cifra text-xs text-tenue">
        {a.magnitud} <span className="text-critico">{conUnidad(a.valor, a.magnitud)}</span>
        {` · umbral ${conUnidad(a.umbral, a.magnitud)}`}
      </p>
    </li>
  );
}

const select = "campo w-auto py-1 pr-7 text-xs";

/** Lista de alarmas con filtros y orden; presentacional para probarla sin el sondeo. */
export function ListaAlarmas({ alertas, generadaEn }: { alertas: AlertaReciente[]; generadaEn: string }) {
  const [nodoId, setNodoId] = useState<string | null>(null);
  const [magnitud, setMagnitud] = useState<Magnitud | null>(null);
  const [orden, setOrden] = useState<Orden>("severidad");

  const nodos = [...new Map(alertas.map((a) => [a.nodoId, a.nodoNombre])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const filtradas = filtrarAlarmas(alertas, { nodoId, magnitud });
  const visibles = orden === "severidad" ? ordenarAlarmas(filtradas) : filtradas; // la API ya las trae por hora
  const ahora = Date.parse(generadaEn);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap gap-2 border-b border-borde px-4 py-2.5">
        <label>
          <span className="sr-only">Filtrar por nodo</span>
          <select className={select} value={nodoId ?? ""} onChange={(e) => setNodoId(e.target.value || null)}>
            <option value="">Todos los nodos</option>
            {nodos.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrar por magnitud</span>
          <select className={select} value={magnitud ?? ""} onChange={(e) => setMagnitud((e.target.value || null) as Magnitud | null)}>
            <option value="">Todas las magnitudes</option>
            {MAGNITUDES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Ordenar por</span>
          <select className={select} value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
            <option value="severidad">Severidad y hora</option>
            <option value="hora">Hora (más reciente primero)</option>
          </select>
        </label>
      </div>
      {visibles.length === 0 ? (
        <p className="px-4 py-6 text-sm text-tenue">{alertas.length === 0 ? "Sin alertas" : "Ninguna alerta coincide con el filtro."}</p>
      ) : (
        <ul aria-label="Alarmas" className="min-h-0 flex-1 overflow-y-auto">
          {visibles.map((a) => (
            <Alarma key={a.id} a={a} activa={ahora - Date.parse(a.creadaEn) <= VENTANA_MS} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Panel de alarmas en vivo: las alertas de la última instantánea. */
export function PanelAlarmas() {
  const { instantanea } = useEstadoVivo();
  return <ListaAlarmas alertas={instantanea.alertas} generadaEn={instantanea.generadaEn} />;
}
