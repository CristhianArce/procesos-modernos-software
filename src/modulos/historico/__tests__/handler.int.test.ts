import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "@/app/api/historico/route";

const prefijo = `int-api-historico-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/historico";
const BASE = "2091-01-01T00:00:00.000Z";
let nodoId: string;
let sensorId: string;
let otroSensorId: string;

const consultar = async (consulta: string, rol?: "administrador" | "tecnico") =>
  GET(await peticion("GET", `${RUTA}${consulta}`, { rol }), undefined);

beforeAll(async () => {
  nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  sensorId = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's1') RETURNING id", [nodoId])).rows[0].id;
  otroSensorId = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's2') RETURNING id", [nodoId])).rows[0].id;
  const insertar = (id: string, minutos: number[]) =>
    db().query(
      `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
       SELECT $1::uuid, 120, 1, 120, $3::timestamptz + make_interval(mins => m) FROM unnest($2::int[]) AS m`,
      [id, minutos, BASE],
    );
  await insertar(sensorId, Array.from({ length: 26 }, (_, i) => i));
  await insertar(otroSensorId, [100, 101]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("API del histórico", () => {
  it("#26 CA-5: sin sesión responde 401 en JSON", async () => {
    const res = await consultar("");
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it("#26 CA-5: sin sesión responde 401 aunque los parámetros sean inválidos", async () => {
    expect((await consultar("?desde=ayer")).status).toBe(401);
  });

  it("#26 CA-4: fecha mal formada responde 400 con el detalle del campo", async () => {
    const res = await consultar("?desde=ayer", "administrador");
    expect(res.status).toBe(400);
    expect((await res.json()).detalles[0].campo).toBe("desde");
  });

  it("#26 CA-4: rango invertido responde 400", async () => {
    const res = await consultar("?desde=2091-01-02T00:00:00Z&hasta=2091-01-01T00:00:00Z", "administrador");
    expect(res.status).toBe(400);
  });

  it.each([
    ["sensorId que no es UUID", "sensorId=abc"],
    ["nodoId que no es UUID", "nodoId=abc"],
    ["página 0", "pagina=0"],
  ])("#26 CA-4: %s responde 400", async (_caso, consulta) => {
    expect((await consultar(`?${consulta}`, "tecnico")).status).toBe(400);
  });

  it("#26 CA-1: devuelve 25 lecturas, la más reciente primero, y el total", async () => {
    const res = await consultar(`?nodoId=${nodoId}&sensorId=${sensorId}`, "administrador");
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo).toMatchObject({ total: 26, pagina: 1, tamano: 25 });
    expect(cuerpo.lecturas).toHaveLength(25);
    const fechas = cuerpo.lecturas.map((l: { tomadaEn: string }) => Date.parse(l.tomadaEn));
    expect(fechas).toEqual([...fechas].sort((a: number, b: number) => b - a));
  });

  it("#26 CA-1: la página 2 trae la única lectura restante", async () => {
    const cuerpo = await (await consultar(`?sensorId=${sensorId}&pagina=2`, "administrador")).json();
    expect(cuerpo.pagina).toBe(2);
    expect(cuerpo.lecturas).toHaveLength(1);
    expect(cuerpo.lecturas[0].tomadaEn).toBe(BASE);
  });

  it("#26 CA-1: administrador y técnico reciben 200", async () => {
    expect((await consultar(`?sensorId=${sensorId}`, "administrador")).status).toBe(200);
    expect((await consultar(`?sensorId=${sensorId}`, "tecnico")).status).toBe(200);
  });

  it("#26 CA-2: filtra por sensorId", async () => {
    const cuerpo = await (await consultar(`?sensorId=${otroSensorId}`, "tecnico")).json();
    expect(cuerpo.total).toBe(2);
    expect(cuerpo.lecturas.every((l: { sensorId: string }) => l.sensorId === otroSensorId)).toBe(true);
  });

  it("#26 CA-2: filtra por nodoId y por rango de fechas con extremos inclusivos", async () => {
    const desde = encodeURIComponent("2091-01-01T00:10:00.000Z");
    const hasta = encodeURIComponent("2091-01-01T00:19:00.000Z");
    const cuerpo = await (await consultar(`?nodoId=${nodoId}&desde=${desde}&hasta=${hasta}`, "administrador")).json();
    expect(cuerpo.total).toBe(10);
  });

  it("#26 CA-3: filtro sin resultados devuelve lista vacía y total 0", async () => {
    const res = await consultar(`?sensorId=${randomUUID()}`, "administrador");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ lecturas: [], total: 0 });
  });

  it("#26 CA-3: una página más allá de la última devuelve lista vacía y el total real", async () => {
    const res = await consultar(`?sensorId=${sensorId}&pagina=99`, "administrador");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ lecturas: [], total: 26 });
  });
});
