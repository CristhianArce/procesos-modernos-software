import "server-only";
import { db } from "@/lib/db";
import type { ConsultaRecientes } from "@/modulos/lecturas/schema";
import type { Magnitud } from "./schema";

export type AlertaNueva = { sensorId: string; magnitud: Magnitud; valor: number; umbral: number };
export type Alerta = AlertaNueva & { id: string; creadaEn: string };

type Fila = { id: string; sensor_id: string; magnitud: Magnitud; valor: number; umbral: number; creada_en: Date };

const COLUMNAS = "id, sensor_id, magnitud, valor, umbral, creada_en";
const aAlerta = (f: Fila): Alerta => ({
  id: f.id,
  sensorId: f.sensor_id,
  magnitud: f.magnitud,
  valor: f.valor,
  umbral: f.umbral,
  creadaEn: f.creada_en.toISOString(),
});

/** Inserta todas las alertas en una sola sentencia. */
export async function insertar(alertas: AlertaNueva[]): Promise<Alerta[]> {
  const { rows } = await db().query<Fila>(
    `INSERT INTO alertas (sensor_id, magnitud, valor, umbral)
     SELECT * FROM unnest($1::uuid[], $2::text[], $3::float8[], $4::float8[])
     RETURNING ${COLUMNAS}`,
    [alertas.map((a) => a.sensorId), alertas.map((a) => a.magnitud), alertas.map((a) => a.valor), alertas.map((a) => a.umbral)],
  );
  return rows.map(aAlerta);
}

/** De la más reciente a la más antigua, filtradas por sensor si se indica. */
export async function recientes({ sensorId, limite }: ConsultaRecientes): Promise<Alerta[]> {
  const { rows } = await db().query<Fila>(
    `SELECT ${COLUMNAS} FROM alertas WHERE ($1::uuid IS NULL OR sensor_id = $1)
     ORDER BY creada_en DESC, id DESC LIMIT $2`,
    [sensorId ?? null, limite],
  );
  return rows.map(aAlerta);
}
