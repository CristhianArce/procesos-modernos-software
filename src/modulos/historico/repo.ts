import "server-only";
import { db } from "@/lib/db";
import type { FilaHistorico } from "./tipos";
import type { HistoricoFiltros } from "./schema";

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

const aFila = (f: Fila): FilaHistorico => ({
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

// Cada filtro ausente llega como NULL y no restringe. Los extremos del rango son inclusivos (decisión #1).
const DESDE_Y_DONDE = `
  FROM lecturas l
  JOIN sensores s ON s.id = l.sensor_id
  JOIN nodos n ON n.id = s.nodo_id
  WHERE ($1::uuid IS NULL OR s.nodo_id = $1)
    AND ($2::uuid IS NULL OR l.sensor_id = $2)
    AND ($3::timestamptz IS NULL OR l.tomada_en >= $3)
    AND ($4::timestamptz IS NULL OR l.tomada_en <= $4)`;

/** Una página de lecturas, la más reciente primero (desempate por id, decisión #2), y el total que cumple el filtro. */
export async function consultar({
  nodoId,
  sensorId,
  desde,
  hasta,
  limite,
  desplazamiento,
}: Omit<HistoricoFiltros, "pagina"> & { limite: number; desplazamiento: number }): Promise<{ lecturas: FilaHistorico[]; total: number }> {
  const filtros = [nodoId ?? null, sensorId ?? null, desde ?? null, hasta ?? null];
  const [pagina, conteo] = await Promise.all([
    db().query<Fila>(
      `SELECT l.id, l.sensor_id, s.nombre AS sensor_nombre, s.nodo_id, n.nombre AS nodo_nombre,
              l.voltaje, l.corriente, l.potencia, l.tomada_en ${DESDE_Y_DONDE}
       ORDER BY l.tomada_en DESC, l.id DESC LIMIT $5 OFFSET $6`,
      [...filtros, limite, desplazamiento],
    ),
    db().query<{ total: string }>(`SELECT count(*) AS total ${DESDE_Y_DONDE}`, filtros),
  ]);
  return { lecturas: pagina.rows.map(aFila), total: Number(conteo.rows[0].total) };
}
