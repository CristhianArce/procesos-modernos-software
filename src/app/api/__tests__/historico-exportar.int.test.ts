import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../historico/exportar/route";

const prefijo = `int-api-exportar-${randomUUID().slice(0, 8)}`;
const ENCABEZADO = "nodo,sensor,voltaje,corriente,potencia,fecha";
let nodo1: string;
let nodo3: string;
let sensorA: string;
let sensorB: string;

beforeAll(async () => {
  await db().query("INSERT INTO nodos (nombre) VALUES ($1), ($2)", [`${prefijo} N1`, `${prefijo} "N,3"`]);
  const nodos = (await db().query("SELECT id, nombre FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`])).rows;
  nodo1 = nodos.find((n) => n.nombre === `${prefijo} N1`).id;
  nodo3 = nodos.find((n) => n.nombre === `${prefijo} "N,3"`).id;
  const sensores = (
    await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, $3), ($2, $4) RETURNING id, nombre", [
      nodo1,
      nodo3,
      `${prefijo} A`,
      `=${prefijo} F`,
    ])
  ).rows;
  sensorA = sensores.find((s) => s.nombre === `${prefijo} A`).id;
  sensorB = sensores.find((s) => s.nombre === `=${prefijo} F`).id;
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
     ($1, 120, 5, 600, '2026-05-10 08:00:00-05'),
     ($1, 121, 5, 605, '2026-05-11 09:00:00-05'),
     ($1, 122, 4, 488, '2026-05-12 10:00:00-05'),
     ($1, 119, 4, 476, '2026-05-14 10:00:00-05'),
     ($2, 118, 3, 354, '2026-05-11 12:00:00-05')`,
    [sensorA, sensorB],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

const exportar = async (query: string, rol?: "administrador" | "tecnico") =>
  GET(await peticion("GET", `/api/historico/exportar${query}`, { rol }), undefined);

const lineas = (csv: string) => csv.split("\r\n");

describe("API de exportación del histórico", () => {
  it("#56 CA-1: con un filtro responde 200 text/csv de descarga, sin caché y solo con las filas del filtro", async () => {
    const res = await exportar(`?nodoId=${nodo1}&sensorId=${sensorA}&desde=2026-05-10&hasta=2026-05-12`, "administrador");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain('filename="historico.csv"');
    expect(res.headers.get("cache-control")).toBe("no-store");
    const csv = await res.text();
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(lineas(csv)).toEqual([
      ENCABEZADO,
      `${prefijo} N1,${prefijo} A,122,4,488,2026-05-12T15:00:00.000Z`,
      `${prefijo} N1,${prefijo} A,121,5,605,2026-05-11T14:00:00.000Z`,
      `${prefijo} N1,${prefijo} A,120,5,600,2026-05-10T13:00:00.000Z`,
      "",
    ]);
  });

  it("#56 CA-1: un parámetro vacío equivale a no filtrar y pagina no afecta", async () => {
    const res = await exportar(`?nodoId=${nodo1}&sensorId=&desde=&hasta=&pagina=2`, "administrador");
    expect(res.status).toBe(200);
    const filas = lineas(await res.text()).filter((l) => l !== "");
    expect(filas).toHaveLength(5);
    expect(filas[1]).toContain("2026-05-14T15:00:00.000Z");
  });

  it("#56 CA-1: un nombre que empieza por = sale con apóstrofo y uno con coma y comillas va entre comillas", async () => {
    const res = await exportar(`?nodoId=${nodo3}`, "administrador");
    expect(res.status).toBe(200);
    expect(lineas(await res.text())).toEqual([
      ENCABEZADO,
      `"${prefijo} ""N,3""",'=${prefijo} F,118,3,354,2026-05-11T17:00:00.000Z`,
      "",
    ]);
    expect(sensorB).toBeDefined();
  });

  it("#56 CA-2: un filtro sin resultados responde 200 con solo el encabezado", async () => {
    const res = await exportar(`?nodoId=${nodo1}&desde=2001-01-01&hasta=2001-01-02`, "tecnico");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(`${ENCABEZADO}\r\n`);
  });

  it.each([
    ["desde mal formada", "?desde=2026-13-40"],
    ["desde con otro formato", "?desde=10/05/2026"],
    ["hasta mal formada", "?hasta=ayer"],
    ["rango invertido", "?desde=2026-05-12&hasta=2026-05-10"],
    ["nodoId que no es UUID", "?nodoId=abc"],
  ])("#56 CA-3: %s responde 400 en JSON con detalles y sin CSV", async (_caso, query) => {
    const res = await exportar(query, "administrador");
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/json");
    const cuerpo = await res.json();
    expect(cuerpo.error).toEqual(expect.any(String));
    expect(cuerpo.detalles).toBeDefined();
  });

  it("#56 CA-4: sin sesión responde 401 con No autenticado y sin lecturas", async () => {
    const res = await exportar(`?nodoId=${nodo1}`);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it.each(["administrador", "tecnico"] as const)("#56 CA-4: el %s recibe 200 con el CSV", async (rol) => {
    const res = await exportar(`?nodoId=${nodo1}&sensorId=${sensorA}`, rol);
    expect(res.status).toBe(200);
    expect(lineas(await res.text())[0]).toBe(ENCABEZADO);
  });

  it("#56 CA-1: exportar no cambia el número de filas de lecturas", async () => {
    const cuenta = async () =>
      Number((await db().query("SELECT count(*) AS n FROM lecturas WHERE sensor_id = ANY($1)", [[sensorA, sensorB]])).rows[0].n);
    const antes = await cuenta();
    await exportar(`?nodoId=${nodo1}`, "administrador");
    expect(await cuenta()).toBe(antes);
    expect(antes).toBe(5);
  });
});
