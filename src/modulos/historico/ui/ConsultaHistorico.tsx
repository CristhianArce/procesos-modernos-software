"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Cargando } from "@/modulos/ui/Cargando";
import { EstadoError } from "@/modulos/ui/EstadoError";
import { Tarjeta } from "@/modulos/ui/Tarjeta";
import type { PaginaHistorico } from "../tipos";
import { TablaHistorico } from "./TablaHistorico";

type Opcion = { id: string; nombre: string };
type OpcionSensor = Opcion & { nodoId: string };
type Filtros = { nodoId: string; sensorId: string; desde: string; hasta: string };
/** El resultado lleva la clave de la consulta que lo produjo: si no es la actual, la pantalla sigue cargando. */
type Resultado = { clave: string } & ({ tipo: "error" } | { tipo: "listo"; datos: PaginaHistorico });

const SIN_FILTROS: Filtros = { nodoId: "", sensorId: "", desde: "", hasta: "" };

/** El campo `datetime-local` entrega hora local sin zona; la API pide ISO 8601 con zona. */
const aIso = (local: string) => (local ? new Date(local).toISOString() : "");

function armarConsulta(f: Filtros, pagina: number): string {
  const q = new URLSearchParams({ pagina: String(pagina) });
  if (f.nodoId) q.set("nodoId", f.nodoId);
  if (f.sensorId) q.set("sensorId", f.sensorId);
  if (f.desde) q.set("desde", aIso(f.desde));
  if (f.hasta) q.set("hasta", aIso(f.hasta));
  return q.toString();
}

type Props = { nodos: Opcion[]; sensores: OpcionSensor[] };

/** Histórico de lecturas: filtros por nodo, sensor y fechas, y una tabla paginada que consulta `/api/historico`. */
export function ConsultaHistorico({ nodos, sensores }: Props) {
  const [borrador, setBorrador] = useState<Filtros>(SIN_FILTROS);
  const [aplicados, setAplicados] = useState<Filtros>(SIN_FILTROS);
  const [pagina, setPagina] = useState(1);
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const consulta = armarConsulta(aplicados, pagina);
  const clave = `${consulta}#${intento}`;

  useEffect(() => {
    let vigente = true;
    fetch(`/api/historico?${consulta}`)
      .then((r) => (r.ok ? (r.json() as Promise<PaginaHistorico>) : Promise.reject(new Error(String(r.status)))))
      .then((datos) => vigente && setResultado({ clave, tipo: "listo", datos }))
      .catch(() => vigente && setResultado({ clave, tipo: "error" }));
    return () => {
      vigente = false;
    };
  }, [consulta, clave]);

  const actual = resultado?.clave === clave ? resultado : null;

  const cambiar = (campo: keyof Filtros, valor: string) =>
    setBorrador((b) => ({ ...b, [campo]: valor, ...(campo === "nodoId" ? { sensorId: "" } : {}) }));
  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    setAplicados(borrador);
    setPagina(1);
  };
  const limpiar = () => {
    setBorrador(SIN_FILTROS);
    setAplicados(SIN_FILTROS);
    setPagina(1);
  };

  const sensoresVisibles = borrador.nodoId ? sensores.filter((s) => s.nodoId === borrador.nodoId) : sensores;
  const rangoInvertido = Boolean(borrador.desde && borrador.hasta && borrador.desde > borrador.hasta);

  return (
    <div className="space-y-6">
      <Tarjeta titulo="Filtros">
        <form onSubmit={aplicar} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="etiqueta-campo">Nodo</span>
            <select className="campo" value={borrador.nodoId} onChange={(e) => cambiar("nodoId", e.target.value)}>
              <option value="">Todos los nodos</option>
              {nodos.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="etiqueta-campo">Sensor</span>
            <select className="campo" value={borrador.sensorId} onChange={(e) => cambiar("sensorId", e.target.value)}>
              <option value="">Todos los sensores</option>
              {sensoresVisibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="etiqueta-campo">Desde</span>
            <input type="datetime-local" className="campo" value={borrador.desde} onChange={(e) => cambiar("desde", e.target.value)} />
          </label>
          <label>
            <span className="etiqueta-campo">Hasta</span>
            <input type="datetime-local" className="campo" value={borrador.hasta} onChange={(e) => cambiar("hasta", e.target.value)} />
          </label>
          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-4">
            <button type="submit" className="boton-primario" disabled={rangoInvertido}>
              Aplicar filtros
            </button>
            <button type="button" className="boton-fantasma" onClick={limpiar}>
              Limpiar
            </button>
            {rangoInvertido && (
              <p role="alert" className="text-sm text-critico">
                La fecha inicial no puede ser posterior a la final.
              </p>
            )}
          </div>
        </form>
      </Tarjeta>

      <Tarjeta titulo="Lecturas">
        {!actual && <Cargando etiqueta="Cargando lecturas…" />}
        {actual?.tipo === "error" && <EstadoError titulo="No se pudo cargar el histórico" onReintentar={() => setIntento((i) => i + 1)} />}
        {actual?.tipo === "listo" && <Pagina datos={actual.datos} onPagina={setPagina} />}
      </Tarjeta>
    </div>
  );
}

function Pagina({ datos, onPagina }: { datos: PaginaHistorico; onPagina: (p: number) => void }) {
  const totalPaginas = Math.max(1, Math.ceil(datos.total / datos.tamano));
  return (
    <div className="space-y-4">
      <TablaHistorico filas={datos.lecturas} />
      <nav aria-label="Paginación del histórico" className="flex items-center justify-between gap-2">
        <p className="text-sm text-tenue" aria-live="polite" data-testid="historico-total">
          {`${datos.total} lecturas · página ${datos.pagina} de ${totalPaginas}`}
        </p>
        <div className="flex gap-2">
          <button type="button" className="boton-fantasma" disabled={datos.pagina <= 1} onClick={() => onPagina(datos.pagina - 1)}>
            Anterior
          </button>
          <button type="button" className="boton-fantasma" disabled={datos.pagina >= totalPaginas} onClick={() => onPagina(datos.pagina + 1)}>
            Siguiente
          </button>
        </div>
      </nav>
    </div>
  );
}
