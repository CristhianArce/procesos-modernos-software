import "server-only";
import { db } from "@/lib/db";
import type { SensorCrear, SensorEditar } from "./schema";

export type Sensor = {
  id: string;
  nodoId: string;
  nombre: string;
  umbralVoltaje: number | null;
  umbralCorriente: number | null;
  umbralPotencia: number | null;
  creadoEn: string;
};

type Fila = {
  id: string;
  nodo_id: string;
  nombre: string;
  umbral_voltaje: number | null;
  umbral_corriente: number | null;
  umbral_potencia: number | null;
  creado_en: Date;
};

const COLUMNAS = "id, nodo_id, nombre, umbral_voltaje, umbral_corriente, umbral_potencia, creado_en";
const aSensor = (f: Fila): Sensor => ({
  id: f.id,
  nodoId: f.nodo_id,
  nombre: f.nombre,
  umbralVoltaje: f.umbral_voltaje,
  umbralCorriente: f.umbral_corriente,
  umbralPotencia: f.umbral_potencia,
  creadoEn: f.creado_en.toISOString(),
});

// Columna de cada campo editable: los nombres del SET salen de aquí, nunca de la entrada.
const COLUMNA_EDITABLE = {
  nombre: "nombre",
  umbralVoltaje: "umbral_voltaje",
  umbralCorriente: "umbral_corriente",
  umbralPotencia: "umbral_potencia",
} as const;

export async function crear(entrada: SensorCrear): Promise<Sensor> {
  const { rows } = await db().query<Fila>(
    `INSERT INTO sensores (nodo_id, nombre, umbral_voltaje, umbral_corriente, umbral_potencia)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNAS}`,
    [entrada.nodoId, entrada.nombre, entrada.umbralVoltaje ?? null, entrada.umbralCorriente ?? null, entrada.umbralPotencia ?? null],
  );
  return aSensor(rows[0]);
}

export async function listarPorNodo(nodoId: string): Promise<Sensor[]> {
  const { rows } = await db().query<Fila>(`SELECT ${COLUMNAS} FROM sensores WHERE nodo_id = $1 ORDER BY creado_en, id`, [nodoId]);
  return rows.map(aSensor);
}

export async function buscar(id: string): Promise<Sensor | null> {
  const { rows } = await db().query<Fila>(`SELECT ${COLUMNAS} FROM sensores WHERE id = $1`, [id]);
  return rows[0] ? aSensor(rows[0]) : null;
}

/** Cambia solo los campos enviados; un umbral en null lo quita. Devuelve null si el sensor no existe. */
export async function actualizar(id: string, cambios: SensorEditar): Promise<Sensor | null> {
  const campos = (Object.keys(COLUMNA_EDITABLE) as (keyof typeof COLUMNA_EDITABLE)[]).filter((c) => cambios[c] !== undefined);
  if (campos.length === 0) return buscar(id);
  const asignaciones = campos.map((c, i) => `${COLUMNA_EDITABLE[c]} = $${i + 2}`).join(", ");
  const { rows } = await db().query<Fila>(`UPDATE sensores SET ${asignaciones} WHERE id = $1 RETURNING ${COLUMNAS}`, [
    id,
    ...campos.map((c) => cambios[c]),
  ]);
  return rows[0] ? aSensor(rows[0]) : null;
}

/** Elimina el sensor y, en cascada, sus lecturas (decisión #5). Devuelve si existía. */
export async function eliminar(id: string): Promise<boolean> {
  const { rowCount } = await db().query("DELETE FROM sensores WHERE id = $1", [id]);
  return rowCount === 1;
}
