import "server-only";
import { db } from "@/lib/db";
import { type HistoricoFiltros, TAMANO_PAGINA } from "./schema";

export type FilaHistorico = {
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

// Cada filtro ausente llega como NULL y no restringe; `desde` se incluye y `hasta` se excluye (decisión #1).
const DESDE_JOIN = `FROM lecturas l
  JOIN sensores s ON s.id = l.sensor_id
  JOIN nodos n ON n.id = s.nodo_id
  WHERE ($1::uuid IS NULL OR n.id = $1)
    AND ($2::uuid IS NULL OR s.id = $2)
    AND ($3::timestamptz IS NULL OR l.tomada_en >= $3)
    AND ($4::timestamptz IS NULL OR l.tomada_en < $4)`;

const parametros = (f: HistoricoFiltros) => [f.nodoId ?? null, f.sensorId ?? null, f.desde ?? null, f.hasta ?? null];

/** Una página de lecturas, de la más reciente a la más antigua, con desempate por id descendente (decisión #3). */
export async function consultar(filtros: HistoricoFiltros): Promise<FilaHistorico[]> {
  const { rows } = await db().query<Fila>(
    `SELECT l.id, l.sensor_id, s.nombre AS sensor_nombre, n.id AS nodo_id, n.nombre AS nodo_nombre,
            l.voltaje, l.corriente, l.potencia, l.tomada_en
     ${DESDE_JOIN}
     ORDER BY l.tomada_en DESC, l.id DESC LIMIT $5 OFFSET $6`,
    [...parametros(filtros), TAMANO_PAGINA, (filtros.pagina - 1) * TAMANO_PAGINA],
  );
  return rows.map((f) => ({
    id: f.id,
    sensorId: f.sensor_id,
    sensorNombre: f.sensor_nombre,
    nodoId: f.nodo_id,
    nodoNombre: f.nodo_nombre,
    voltaje: f.voltaje,
    corriente: f.corriente,
    potencia: f.potencia,
    tomadaEn: f.tomada_en.toISOString(),
  }));
}

/** Cuántas lecturas cumplen los filtros, sin paginar. */
export async function contar(filtros: HistoricoFiltros): Promise<number> {
  const { rows } = await db().query<{ total: string }>(`SELECT count(*) AS total ${DESDE_JOIN}`, parametros(filtros));
  return Number(rows[0].total);
}
