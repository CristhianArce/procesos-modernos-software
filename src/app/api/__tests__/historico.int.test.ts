import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../historico/route";

const prefijo = `int-api-historico-${randomUUID().slice(0, 8)}`;
let nodo1: string;
let nodo2: string;
let sensorA: string;
let sensorB: string;
let sensorC: string;

beforeAll(async () => {
  await db().query("INSERT INTO nodos (nombre) VALUES ($1), ($2)", [`${prefijo} N1`, `${prefijo} N2`]);
  const nodos = (await db().query("SELECT id, nombre FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`])).rows;
  nodo1 = nodos.find((n) => n.nombre === `${prefijo} N1`).id;
  nodo2 = nodos.find((n) => n.nombre === `${prefijo} N2`).id;
  const sensores = (
    await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, $3), ($1, $4), ($2, $5) RETURNING id, nombre", [
      nodo1,
      nodo2,
      `${prefijo} A`,
      `${prefijo} B`,
      `${prefijo} C`,
    ])
  ).rows;
  const id = (sufijo: string) => sensores.find((s) => s.nombre === `${prefijo} ${sufijo}`).id;
  [sensorA, sensorB, sensorC] = [id("A"), id("B"), id("C")];
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
     SELECT $1, 120 + n / 10.0, 5, 600, timestamptz '2026-03-10 08:00:00-05' + (n - 1) * interval '2 hours'
     FROM generate_series(1, 26) AS n`,
    [sensorA],
  );
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
     ($1, 119, 4, 476, '2026-03-11 09:00:00-05'), ($1, 119, 4, 476, '2026-03-11 10:00:00-05'),
     ($2, 121, 5, 605, '2026-03-09 23:30:00-05'), ($2, 121, 5, 605, '2026-03-13 00:30:00-05'),
     ($3, 118, 3, 354, '2026-03-11 12:00:00-05')`,
    [sensorB, sensorA, sensorC],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

const consultar = async (query: string, rol?: "administrador" | "tecnico") =>
  GET(await peticion("GET", `/api/historico${query}`, { rol }), undefined);

const filtro = () => `nodoId=${nodo1}&sensorId=${sensorA}&desde=2026-03-10&hasta=2026-03-12`;
const cuenta = async () =>
  Number((await db().query("SELECT count(*) AS n FROM lecturas WHERE sensor_id = ANY($1)", [[sensorA, sensorB, sensorC]])).rows[0].n);

describe("API del histórico", () => {
  it.each(["administrador", "tecnico"] as const)("#26 CA-1: el %s recibe 200 con 25 lecturas, la más reciente primero", async (rol) => {
    const res = await consultar(`?${filtro()}`, rol);
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo).toMatchObject({ pagina: 1, porPagina: 25, total: 26, totalPaginas: 2 });
    expect(cuerpo.lecturas).toHaveLength(25);
    const tiempos = cuerpo.lecturas.map((l: { tomadaEn: string }) => new Date(l.tomadaEn).getTime());
    expect([...tiempos].sort((a, b) => b - a)).toEqual(tiempos);
    expect(new Date(cuerpo.lecturas[0].tomadaEn).toISOString()).toBe(new Date("2026-03-12T10:00:00-05:00").toISOString());
    expect(cuerpo.lecturas[0]).toMatchObject({ nodoNombre: `${prefijo} N1`, sensorNombre: `${prefijo} A` });
  });

  it("#26 CA-1: administrador y técnico reciben la misma respuesta", async () => {
    const a = await (await consultar(`?${filtro()}`, "administrador")).json();
    const t = await (await consultar(`?${filtro()}`, "tecnico")).json();
    expect(a.total).toBe(26);
    expect(t).toEqual(a);
  });

  it("#26 CA-1: pagina=2 trae la lectura restante y una página posterior viene vacía con el mismo total", async () => {
    const dos = await (await consultar(`?${filtro()}&pagina=2`, "tecnico")).json();
    expect(dos).toMatchObject({ pagina: 2, total: 26, totalPaginas: 2 });
    expect(dos.lecturas).toHaveLength(1);
    expect(new Date(dos.lecturas[0].tomadaEn).toISOString()).toBe(new Date("2026-03-10T08:00:00-05:00").toISOString());
    const tres = await consultar(`?${filtro()}&pagina=3`, "tecnico");
    expect(tres.status).toBe(200);
    expect(await tres.json()).toMatchObject({ lecturas: [], total: 26 });
  });

  it("#26 CA-2: los filtros se combinan y los bordes del día se interpretan en Bogotá", async () => {
    const cuerpo = await (await consultar(`?${filtro()}`, "administrador")).json();
    expect(cuerpo.total).toBe(26);
    const soloB = await (await consultar(`?nodoId=${nodo1}&sensorId=${sensorB}`, "administrador")).json();
    expect(soloB.total).toBe(2);
    const unDia = await (await consultar(`?sensorId=${sensorA}&desde=2026-03-11&hasta=2026-03-11`, "administrador")).json();
    expect(unDia.total).toBe(12);
  });

  it("#26 CA-2: un parámetro vacío equivale a no filtrar", async () => {
    const res = await consultar(`?nodoId=${nodo2}&sensorId=&desde=&hasta=`, "administrador");
    expect(res.status).toBe(200);
    expect((await res.json()).total).toBe(1);
  });

  it("#26 CA-3: un rango sin lecturas responde 200 con lecturas vacía, total 0 y totalPaginas 0", async () => {
    const res = await consultar(`?nodoId=${nodo1}&desde=2001-01-01&hasta=2001-01-02`, "administrador");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ lecturas: [], total: 0, totalPaginas: 0 });
  });

  it.each([
    ["un nodo inexistente", () => `?nodoId=${randomUUID()}`],
    ["un sensor inexistente", () => `?sensorId=${randomUUID()}`],
    ["un sensor de otro nodo", () => `?nodoId=${nodo2}&sensorId=${sensorA}`],
  ])("#26 CA-3: %s responde 200 con lecturas vacía y total 0", async (_caso, query) => {
    const res = await consultar(query(), "tecnico");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ lecturas: [], total: 0 });
  });

  it.each([
    ["desde mal formada", "?desde=2026-13-40"],
    ["hasta mal formada", "?hasta=ayer"],
    ["rango invertido", "?desde=2026-03-12&hasta=2026-03-10"],
    ["pagina=0", "?pagina=0"],
    ["pagina=abc", "?pagina=abc"],
    ["nodoId que no es UUID", "?nodoId=abc"],
  ])("#26 CA-4: %s responde 400 con detalles", async (_caso, query) => {
    const res = await consultar(query, "administrador");
    expect(res.status).toBe(400);
    const cuerpo = await res.json();
    expect(cuerpo.error).toEqual(expect.any(String));
    expect(cuerpo.detalles).toBeDefined();
  });

  it("#26 CA-5: sin sesión responde 401 en JSON", async () => {
    const res = await consultar(`?${filtro()}`);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it("#26 CA-1: la consulta no cambia el número de filas de lecturas", async () => {
    const antes = await cuenta();
    await consultar(`?${filtro()}`, "administrador");
    await consultar(`?${filtro()}&pagina=2`, "tecnico");
    expect(await cuenta()).toBe(antes);
    expect(antes).toBe(31);
  });
});
