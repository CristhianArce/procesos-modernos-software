import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../lecturas/route";

const prefijo = `int-api-lecturas-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/lecturas";
let sensorId: string;

beforeAll(async () => {
  const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  sensorId = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's') RETURNING id", [nodoId])).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("API de lecturas", () => {
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
    const res = await GET(await peticion("GET", `${RUTA}?${consulta}`, { rol: "administrador" }), undefined);
    expect(res.status).toBe(400);
    expect((await res.json()).detalles[0].campo).toBe(campo);
  });

  it("#22 CA-6: el técnico recibe las dos lecturas más recientes de un sensor con limite=2", async () => {
    const { rows } = await db().query(
      `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
         ($1, 111, 1, 111, now() - interval '3 hour'),
         ($1, 113, 1, 113, now() - interval '1 hour'),
         ($1, 112, 1, 112, now() - interval '2 hour')
       RETURNING id, voltaje`,
      [sensorId],
    );
    const id = (v: number) => rows.find((f) => f.voltaje === v).id;

    const res = await GET(await peticion("GET", `${RUTA}?sensorId=${sensorId}&limite=2`, { rol: "tecnico" }), undefined);

    expect(res.status).toBe(200);
    expect((await res.json()).map((l: { id: string }) => l.id)).toEqual([id(113), id(112)]);
  });
});
