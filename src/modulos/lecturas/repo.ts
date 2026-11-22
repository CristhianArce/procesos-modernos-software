import "server-only";
import { db } from "@/lib/db";

export type LecturaNueva = { sensorId: string; voltaje: number; corriente: number; potencia: number };
export type Lectura = LecturaNueva & { id: string; tomadaEn: string };

type Fila = { id: string; sensor_id: string; voltaje: number; corriente: number; potencia: number; tomada_en: Date };

const COLUMNAS = "id, sensor_id, voltaje, corriente, potencia, tomada_en";
const aLectura = (f: Fila): Lectura => ({
  id: f.id,
  sensorId: f.sensor_id,
  voltaje: f.voltaje,
  corriente: f.corriente,
  potencia: f.potencia,
  tomadaEn: f.tomada_en.toISOString(),
});

/** Inserta todas las lecturas en una sola sentencia. */
export async function insertar(lecturas: LecturaNueva[]): Promise<Lectura[]> {
  const { rows } = await db().query<Fila>(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia)
     SELECT * FROM unnest($1::uuid[], $2::float8[], $3::float8[], $4::float8[])
     RETURNING ${COLUMNAS}`,
    [lecturas.map((l) => l.sensorId), lecturas.map((l) => l.voltaje), lecturas.map((l) => l.corriente), lecturas.map((l) => l.potencia)],
  );
  return rows.map(aLectura);
}

/** La lectura más reciente de cada sensor; un sensor sin lecturas no aparece. */
export async function ultimasPorSensor(sensorIds: string[]): Promise<Lectura[]> {
  const { rows } = await db().query<Fila>(
    `SELECT DISTINCT ON (sensor_id) ${COLUMNAS} FROM lecturas
     WHERE sensor_id = ANY($1::uuid[]) ORDER BY sensor_id, tomada_en DESC, id DESC`,
    [sensorIds],
  );
  return rows.map(aLectura);
}
