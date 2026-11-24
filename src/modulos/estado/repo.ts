import "server-only";
import { db } from "@/lib/db";
import type { Magnitud } from "@/modulos/alertas/schema";
import type { AlertaReciente } from "./alarmas";
import type { Conexion, FilaSensor, PuntoTendencia } from "./calculo";

type Fila = {
  nodo_id: string;
  nombre: string;
  ubicacion: string | null;
  estado: Conexion;
  sensor_id: string | null;
  umbral_voltaje: number | null;
  umbral_corriente: number | null;
  umbral_potencia: number | null;
  voltaje: number | null;
  corriente: number | null;
  potencia: number | null;
  tomada_en: Date | null;
};

const aFila = (f: Fila): FilaSensor => ({
  nodoId: f.nodo_id,
  nombre: f.nombre,
  ubicacion: f.ubicacion,
  conexion: f.estado,
  sensorId: f.sensor_id,
  umbralVoltaje: f.umbral_voltaje,
  umbralCorriente: f.umbral_corriente,
  umbralPotencia: f.umbral_potencia,
  lectura: f.tomada_en
    ? { voltaje: f.voltaje!, corriente: f.corriente!, potencia: f.potencia!, tomadaEn: f.tomada_en.toISOString() }
    : null,
});

/** Una fila por sensor con su última lectura; un nodo sin sensores sale una vez con sensor nulo. */
export async function filasSensores(): Promise<FilaSensor[]> {
  const { rows } = await db().query<Fila>(
    `SELECT n.id AS nodo_id, n.nombre, n.ubicacion, n.estado, s.id AS sensor_id,
            s.umbral_voltaje, s.umbral_corriente, s.umbral_potencia,
            l.voltaje, l.corriente, l.potencia, l.tomada_en
     FROM nodos n
     LEFT JOIN sensores s ON s.nodo_id = n.id
     LEFT JOIN LATERAL (
       SELECT voltaje, corriente, potencia, tomada_en FROM lecturas
       WHERE sensor_id = s.id ORDER BY tomada_en DESC, id DESC LIMIT 1
     ) l ON true
     ORDER BY n.creado_en, n.id, s.creado_en, s.id`,
  );
  return rows.map(aFila);
}

/** Alertas registradas en los últimos `minutos`, por nodo (decisión #10 del plan). */
export async function alertasActivasPorNodo(minutos: number): Promise<Map<string, number>> {
  const { rows } = await db().query<{ nodo_id: string; n: number }>(
    `SELECT s.nodo_id, count(*)::int AS n FROM alertas a JOIN sensores s ON s.id = a.sensor_id
     WHERE a.creada_en > now() - make_interval(mins => $1) AND a.creada_en <= now()
     GROUP BY s.nodo_id`,
    [minutos],
  );
  return new Map(rows.map((f) => [f.nodo_id, f.n]));
}

type FilaTendencia = { tension: number | null; potencia: number | null; nodos: number; alertas: number };

/** Intervalos de `pasoS` segundos en los últimos `minutos`: tensión media, potencia total, nodos que reportan y alertas. */
export async function tendencia(minutos: number, pasoS: number): Promise<PuntoTendencia[]> {
  const { rows } = await db().query<FilaTendencia>(
    `WITH l AS (
       SELECT date_bin(make_interval(secs => $2), tomada_en, TIMESTAMPTZ 'epoch') AS t, sensor_id,
              avg(voltaje) AS v, avg(potencia) AS p
       FROM lecturas WHERE tomada_en > now() - make_interval(mins => $1) AND tomada_en <= now()
       GROUP BY 1, 2
     ), lt AS (
       SELECT l.t, avg(l.v) AS tension, sum(l.p) AS potencia, count(DISTINCT s.nodo_id)::int AS nodos
       FROM l JOIN sensores s ON s.id = l.sensor_id JOIN nodos n ON n.id = s.nodo_id AND n.estado = 'conectado'
       GROUP BY l.t
     ), a AS (
       SELECT date_bin(make_interval(secs => $2), creada_en, TIMESTAMPTZ 'epoch') AS t, count(*)::int AS alertas
       FROM alertas WHERE creada_en > now() - make_interval(mins => $1) AND creada_en <= now()
       GROUP BY 1
     )
     SELECT lt.tension, lt.potencia, coalesce(lt.nodos, 0) AS nodos, coalesce(a.alertas, 0) AS alertas
     FROM lt FULL JOIN a ON a.t = lt.t
     ORDER BY coalesce(lt.t, a.t)`,
    [minutos, pasoS],
  );
  return rows.map((f) => ({ tensionMedia: f.tension, potenciaTotal: f.potencia, nodosReportando: f.nodos, alertas: f.alertas }));
}

type FilaAlerta = {
  id: string;
  nodo_id: string;
  nodo_nombre: string;
  sensor_nombre: string;
  magnitud: Magnitud;
  valor: number;
  umbral: number;
  creada_en: Date;
};

/** Las `limite` alertas más recientes, con el nombre de su nodo y de su sensor; solo las de un nodo si se indica. */
export async function alertasRecientes({ limite, nodoId }: { limite: number; nodoId?: string }): Promise<AlertaReciente[]> {
  const { rows } = await db().query<FilaAlerta>(
    `SELECT a.id, n.id AS nodo_id, n.nombre AS nodo_nombre, s.nombre AS sensor_nombre, a.magnitud, a.valor, a.umbral, a.creada_en
     FROM alertas a JOIN sensores s ON s.id = a.sensor_id JOIN nodos n ON n.id = s.nodo_id
     WHERE ($2::uuid IS NULL OR n.id = $2)
     ORDER BY a.creada_en DESC, a.id DESC LIMIT $1`,
    [limite, nodoId ?? null],
  );
  return rows.map((f) => ({
    id: f.id,
    nodoId: f.nodo_id,
    nodoNombre: f.nodo_nombre,
    sensorNombre: f.sensor_nombre,
    magnitud: f.magnitud,
    valor: f.valor,
    umbral: f.umbral,
    creadaEn: f.creada_en.toISOString(),
  }));
}
