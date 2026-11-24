import "server-only";
import { db } from "@/lib/db";
import { POR_PAGINA, type ConsultaHistorico, type FiltrosHistorico } from "./schema";

export type LecturaHistorico = {
  id: string;
  sensorId: string;
  sensorNombre: string;
  nodoId: string;
  nodoNombre: string;
  voltaje: number;
  corriente: number;
  potencia: number;
  tomadaEn: string;
};

type Fila = {
  id: string;
  sensor_id: string;
  sensor_nombre: string;
  nodo_id: string;
  nodo_nombre: string;
  voltaje: number;
  corriente: number;
  potencia: number;
  tomada_en: Date;
};

const DESDE_Y_DONDE = `FROM lecturas l JOIN sensores s ON s.id = l.sensor_id JOIN nodos n ON n.id = s.nodo_id
  WHERE ($1::uuid IS NULL OR n.id = $1) AND ($2::uuid IS NULL OR s.id = $2)
    AND ($3::timestamptz IS NULL OR l.tomada_en >= $3) AND ($4::timestamptz IS NULL OR l.tomada_en <= $4)`;

const parametros = (f: FiltrosHistorico) => [f.nodoId ?? null, f.sensorId ?? null, f.desde ?? null, f.hasta ?? null];

const aLecturaHistorico = (f: Fila): LecturaHistorico => ({
  id: f.id,
  sensorId: f.sensor_id,
  sensorNombre: f.sensor_nombre,
  nodoId: f.nodo_id,
  nodoNombre: f.nodo_nombre,
  voltaje: f.voltaje,
  corriente: f.corriente,
  potencia: f.potencia,
  tomadaEn: f.tomada_en.toISOString(),
});

/** Una página de lecturas, la más reciente primero y a igual fecha por id descendente (decisión #3). Solo lee. */
export async function listar(consulta: ConsultaHistorico): Promise<LecturaHistorico[]> {
  const { rows } = await db().query<Fila>(
    `SELECT l.id, l.sensor_id, s.nombre AS sensor_nombre, n.id AS nodo_id, n.nombre AS nodo_nombre,
            l.voltaje, l.corriente, l.potencia, l.tomada_en
     ${DESDE_Y_DONDE} ORDER BY l.tomada_en DESC, l.id DESC LIMIT ${POR_PAGINA} OFFSET $5`,
    [...parametros(consulta), (consulta.pagina - 1) * POR_PAGINA],
  );
  return rows.map(aLecturaHistorico);
}

/** Cuántas lecturas cumplen los filtros. */
export async function contar(filtros: FiltrosHistorico): Promise<number> {
  const { rows } = await db().query<{ total: string }>(`SELECT count(*) AS total ${DESDE_Y_DONDE}`, parametros(filtros));
  return Number(rows[0].total);
}
