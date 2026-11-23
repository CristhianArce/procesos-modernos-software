import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { alertasActivasPorNodo, filasSensores, tendencia } from "../repo";

const prefijo = `int-repo-estado-${randomUUID().slice(0, 8)}`;
let conDatos: string;
let vacio: string;
let s1: string;

beforeAll(async () => {
  const q = (sql: string, p: unknown[]) => db().query(sql, p).then((r) => r.rows);
  [conDatos, vacio] = (await q("INSERT INTO nodos (nombre) VALUES ($1), ($1) RETURNING id", [prefijo])).map((f) => f.id);
  [s1] = (await q("INSERT INTO sensores (nodo_id, nombre, umbral_voltaje) VALUES ($1, 'a', 125) RETURNING id", [conDatos])).map((f) => f.id);
  await q(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
       ($1, 100, 1, 100, now() - interval '2 minutes'),
       ($1, 121, 2, 242, now() - interval '5 seconds')`,
    [s1],
  );
  await q(
    `INSERT INTO alertas (sensor_id, magnitud, valor, umbral, creada_en) VALUES
       ($1, 'voltaje', 130, 125, now() - interval '1 minute'),
       ($1, 'voltaje', 131, 125, now() - interval '1 minute'),
       ($1, 'voltaje', 132, 125, now() - interval '2 hours')`,
    [s1],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("repo del estado de la red", () => {
  it("ui-scada: una fila por sensor con su última lectura y una fila sin sensor para el nodo vacío", async () => {
    const filas = (await filasSensores()).filter((f) => f.nombre === prefijo);
    expect(filas).toHaveLength(2);
    expect(filas.find((f) => f.nodoId === conDatos)).toMatchObject({
      sensorId: s1,
      conexion: "conectado",
      umbralVoltaje: 125,
      umbralCorriente: null,
      lectura: { voltaje: 121, corriente: 2, potencia: 242 },
    });
    expect(filas.find((f) => f.nodoId === vacio)).toMatchObject({ sensorId: null, lectura: null });
  });

  it("ui-scada: cuenta solo las alertas dentro de la ventana, por nodo", async () => {
    const porNodo = await alertasActivasPorNodo(15);
    expect(porNodo.get(conDatos)).toBe(2);
    expect(porNodo.has(vacio)).toBe(false);
  });

  it("ui-scada: la tendencia va en orden de tiempo e incluye las lecturas y alertas de la ventana", async () => {
    const puntos = await tendencia(15, 30);
    expect(puntos.length).toBeGreaterThan(0);
    expect(puntos.every((p) => typeof p.nodosReportando === "number" && typeof p.alertas === "number")).toBe(true);
    expect(puntos.reduce((a, p) => a + p.alertas, 0)).toBeGreaterThanOrEqual(2);
    expect(puntos.some((p) => p.potenciaTotal !== null && p.potenciaTotal >= 242)).toBe(true);
  });
});
