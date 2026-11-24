import "server-only";
import { db } from "@/lib/db";
import { POR_PAGINA, type FiltrosHistorico } from "./schema";

export type LecturaHistorico = {
  id: string;
  nodoId: string;
  nodoNombre: string;
  sensorId: string;
  sensorNombre: string;
  voltaje: number;
  corriente: number;
  potencia: number;
  tomadaEn: string;
};

type Fila = {
  id: string;
  nodo_id: string;
  nodo_nombre: string;
  sensor_id: string;
  sensor_nombre: string;
  voltaje: number;
  corriente: number;
  potencia: number;
  tomada_en: Date;
};

// Solo lectura (RN-1). Los días se interpretan en la hora de Bogotá y "hasta" incluye el día completo (decisiones #1 y #3).
const ORIGEN = `FROM lecturas l JOIN sensores s ON s.id = l.sensor_id JOIN nodos n ON n.id = s.nodo_id
  WHERE ($1::uuid IS NULL OR n.id = $1)
    AND ($2::uuid IS NULL OR s.id = $2)
    AND ($3::date IS NULL OR l.tomada_en >= ($3::date)::timestamp AT TIME ZONE 'America/Bogota')
    AND ($4::date IS NULL OR l.tomada_en < ($4::date + 1)::timestamp AT TIME ZONE 'America/Bogota')`;

const parametros = (f: FiltrosHistorico) => [f.nodoId ?? null, f.sensorId ?? null, f.desde ?? null, f.hasta ?? null];

const aLectura = (f: Fila): LecturaHistorico => ({
  id: f.id,
  nodoId: f.nodo_id,
  nodoNombre: f.nodo_nombre,
  sensorId: f.sensor_id,
  sensorNombre: f.sensor_nombre,
  voltaje: f.voltaje,
  corriente: f.corriente,
  potencia: f.potencia,
  tomadaEn: f.tomada_en.toISOString(),
});

export async function contar(filtros: FiltrosHistorico): Promise<number> {
  const { rows } = await db().query<{ total: number }>(`SELECT count(*)::int AS total ${ORIGEN}`, parametros(filtros));
  return rows[0].total;
}

/** Una página de 25, de la más reciente a la más antigua; el id desempata (decisión #5). */
export async function listarPagina(filtros: FiltrosHistorico, pagina: number): Promise<LecturaHistorico[]> {
  const { rows } = await db().query<Fila>(
    `SELECT l.id, n.id AS nodo_id, n.nombre AS nodo_nombre, s.id AS sensor_id, s.nombre AS sensor_nombre,
            l.voltaje, l.corriente, l.potencia, l.tomada_en
     ${ORIGEN}
     ORDER BY l.tomada_en DESC, l.id DESC LIMIT $5 OFFSET $6`,
    [...parametros(filtros), POR_PAGINA, (pagina - 1) * POR_PAGINA],
  );
  return rows.map(aLectura);
}

/** Las `tope` lecturas más recientes del filtro, para exportar (RN-4, decisión #7). */
export async function listarParaExportar(filtros: FiltrosHistorico, tope: number): Promise<LecturaHistorico[]> {
  const { rows } = await db().query<Fila>(
    `SELECT l.id, n.id AS nodo_id, n.nombre AS nodo_nombre, s.id AS sensor_id, s.nombre AS sensor_nombre,
            l.voltaje, l.corriente, l.potencia, l.tomada_en
     ${ORIGEN}
     ORDER BY l.tomada_en DESC, l.id DESC LIMIT $5`,
    [...parametros(filtros), tope],
  );
  return rows.map(aLectura);
}
