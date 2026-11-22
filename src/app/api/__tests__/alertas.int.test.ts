import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../alertas/route";
import { POST as SIMULAR } from "../simulador/route";

const prefijo = `int-api-alertas-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/alertas";
let nodoId: string;
let sensorId: string;

beforeAll(async () => {
  nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  sensorId = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's') RETURNING id", [nodoId])).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("API de alertas", () => {
  it("#22 CA-6: sin sesión responde 401 en JSON", async () => {
    const res = await GET(await peticion("GET", RUTA), undefined);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it.each([
    ["sensorId que no es UUID", "sensorId=abc", "sensorId"],
    ["límite 0", "limite=0", "limite"],
    ["límite 101", "limite=101", "limite"],
    ["límite no numérico", "limite=x", "limite"],
  ])("#22 CA-7: %s responde 400 por la validación de Zod", async (_caso, consulta, campo) => {
    const res = await GET(await peticion("GET", `${RUTA}?${consulta}`, { rol: "tecnico" }), undefined);
    expect(res.status).toBe(400);
    expect((await res.json()).detalles[0].campo).toBe(campo);
  });

  it("#22 CA-4: el técnico recibe las alertas de un sensor, la más reciente primero", async () => {
    const { rows } = await db().query(
      `INSERT INTO alertas (sensor_id, magnitud, valor, umbral, creada_en) VALUES
         ($1, 'voltaje', 126, 125, now() - interval '3 hour'),
         ($1, 'voltaje', 128, 125, now() - interval '1 hour'),
         ($1, 'voltaje', 127, 125, now() - interval '2 hour')
       RETURNING id, valor`,
      [sensorId],
    );
    const id = (valor: number) => rows.find((f) => f.valor === valor).id;

    const res = await GET(await peticion("GET", `${RUTA}?sensorId=${sensorId}`, { rol: "tecnico" }), undefined);

    expect(res.status).toBe(200);
    expect((await res.json()).map((a: { id: string }) => a.id)).toEqual([id(128), id(127), id(126)]);
  });

  it("#22 CA-3: simular un sensor con umbral de voltaje 1 registra una alerta de voltaje consultable", async () => {
    const otro = (await db().query("INSERT INTO sensores (nodo_id, nombre, umbral_voltaje) VALUES ($1, 'bajo', 1) RETURNING id", [nodoId])).rows[0].id;
    const simulada = await SIMULAR(await peticion("POST", "/api/simulador", { rol: "administrador", cuerpo: { nodoId } }), undefined);
    const lectura = (await simulada.json()).lecturas.find((l: { sensorId: string }) => l.sensorId === otro);

    const res = await GET(await peticion("GET", `${RUTA}?sensorId=${otro}`, { rol: "administrador" }), undefined);

    expect(await res.json()).toEqual([
      { id: expect.any(String), sensorId: otro, magnitud: "voltaje", valor: lectura.voltaje, umbral: 1, creadaEn: expect.any(String) },
    ]);
  });
});
