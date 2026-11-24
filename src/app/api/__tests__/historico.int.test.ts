import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../historico/route";

const prefijo = `int-api-historico-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/historico";
const BASE = "2020-02-01T00:00:00Z";
let nodoA: string;
let nodoB: string;
let sensorA1: string;
let sensorA2: string;
let sensorB1: string;

const en = (minuto: number) => new Date(Date.parse(BASE) + minuto * 60_000).toISOString();

const insertarLecturas = (sensorId: string, minutos: number[]) =>
  db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
     SELECT $1::uuid, 120, 2, 240, $3::timestamptz + make_interval(mins => m) FROM unnest($2::int[]) AS m`,
    [sensorId, minutos, BASE],
  );

const consultar = async (consulta: string, rol: "administrador" | "tecnico" = "tecnico") => {
  const res = await GET(await peticion("GET", `${RUTA}?${consulta}`, { rol }), undefined);
  return { res, cuerpo: await res.json() };
};

beforeAll(async () => {
  nodoA = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-A`])).rows[0].id;
  nodoB = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-B`])).rows[0].id;
  sensorA1 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a1') RETURNING id", [nodoA])).rows[0].id;
  sensorA2 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a2') RETURNING id", [nodoA])).rows[0].id;
  sensorB1 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'b1') RETURNING id", [nodoB])).rows[0].id;
  await insertarLecturas(sensorA1, Array.from({ length: 24 }, (_, i) => i));
  await insertarLecturas(sensorA2, [24, 25]);
  await insertarLecturas(sensorB1, [10, 11, 12]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}-%`]);
  await db().end();
});

describe("API del histórico", () => {
  it("#26 CA-5: sin sesión responde 401 en JSON", async () => {
    const res = await GET(await peticion("GET", RUTA), undefined);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it("#26 CA-5: sin sesión responde 401 aunque los filtros sean inválidos", async () => {
    const res = await GET(await peticion("GET", `${RUTA}?desde=ayer`), undefined);
    expect(res.status).toBe(401);
  });

  it.each([
    ["desde mal formada (ayer)", "desde=ayer", "desde"],
    ["desde sin hora (2026-03-01)", "desde=2026-03-01", "desde"],
    ["nodoId que no es UUID", "nodoId=abc", "nodoId"],
    ["sensorId que no es UUID", "sensorId=abc", "sensorId"],
    ["pagina 0", "pagina=0", "pagina"],
    ["pagina decimal", "pagina=1.5", "pagina"],
    ["desde posterior a hasta", "desde=2026-03-02T00:00:00Z&hasta=2026-03-01T00:00:00Z", "hasta"],
  ])("#26 CA-4: %s responde 400 con el detalle de Zod", async (_caso, consulta, campo) => {
    const { res, cuerpo } = await consultar(consulta, "administrador");
    expect(res.status).toBe(400);
    expect(cuerpo.detalles.map((d: { campo: string }) => d.campo)).toContain(campo);
  });

  it("#26 CA-4: con desde igual a hasta responde 200", async () => {
    const { res } = await consultar(`desde=${en(5)}&hasta=${en(5)}`);
    expect(res.status).toBe(200);
  });

  it("#26 CA-1: el técnico recibe 25 lecturas en la página 1, la más reciente primero, y total 26", async () => {
    const { res, cuerpo } = await consultar(`nodoId=${nodoA}`);

    expect(res.status).toBe(200);
    expect(cuerpo).toMatchObject({ pagina: 1, porPagina: 25, total: 26 });
    expect(cuerpo.items).toHaveLength(25);
    expect(cuerpo.items[0].tomadaEn).toBe(en(25));
    expect(cuerpo.items[24].tomadaEn).toBe(en(1));
  });

  it("#26 CA-1: la página 2 trae la lectura restante, la más antigua", async () => {
    const { res, cuerpo } = await consultar(`nodoId=${nodoA}&pagina=2`);

    expect(res.status).toBe(200);
    expect(cuerpo.pagina).toBe(2);
    expect(cuerpo.total).toBe(26);
    expect(cuerpo.items).toHaveLength(1);
    expect(cuerpo.items[0].tomadaEn).toBe(en(0));
  });

  it("#26 CA-1: una página más allá del final da items vacío con el total real", async () => {
    const { res, cuerpo } = await consultar(`nodoId=${nodoA}&pagina=9`);
    expect(res.status).toBe(200);
    expect(cuerpo.items).toEqual([]);
    expect(cuerpo.total).toBe(26);
  });

  it("#26 CA-1: cada lectura trae nodo, sensor y las tres magnitudes", async () => {
    const { cuerpo } = await consultar(`sensorId=${sensorA2}`);
    expect(cuerpo.items[0]).toMatchObject({
      sensorId: sensorA2,
      sensorNombre: "a2",
      nodoId: nodoA,
      nodoNombre: `${prefijo}-A`,
      voltaje: 120,
      corriente: 2,
      potencia: 240,
    });
  });

  it("#26 CA-2: el filtro de nodo deja solo las lecturas de sus sensores", async () => {
    const { cuerpo } = await consultar(`nodoId=${nodoB}`);
    expect(cuerpo.total).toBe(3);
    expect(cuerpo.items.map((l: { sensorId: string }) => l.sensorId)).toEqual([sensorB1, sensorB1, sensorB1]);
  });

  it("#26 CA-2: el filtro de sensor deja solo las lecturas de ese sensor", async () => {
    const { cuerpo } = await consultar(`sensorId=${sensorA2}`);
    expect(cuerpo.total).toBe(2);
    expect(cuerpo.items.map((l: { tomadaEn: string }) => l.tomadaEn)).toEqual([en(25), en(24)]);
  });

  it("#26 CA-2: el rango incluye ambos extremos", async () => {
    const { cuerpo } = await consultar(`nodoId=${nodoA}&desde=${en(3)}&hasta=${en(5)}`);
    expect(cuerpo.items.map((l: { tomadaEn: string }) => l.tomadaEn)).toEqual([en(5), en(4), en(3)]);
    expect(cuerpo.total).toBe(3);
  });

  it("#26 CA-2: nodo, sensor y fechas a la vez dejan solo lo que cumple todo", async () => {
    const { cuerpo } = await consultar(`nodoId=${nodoA}&sensorId=${sensorA1}&desde=${en(20)}&hasta=${en(25)}`);
    expect(cuerpo.items.map((l: { tomadaEn: string }) => l.tomadaEn)).toEqual([en(23), en(22), en(21), en(20)]);
    expect(cuerpo.total).toBe(4);
  });

  it("#26 CA-3: un rango sin lecturas da 200 con items vacío y total 0", async () => {
    const { res, cuerpo } = await consultar(`nodoId=${nodoA}&desde=2019-01-01T00:00:00Z&hasta=2019-01-02T00:00:00Z`);
    expect(res.status).toBe(200);
    expect(cuerpo.items).toEqual([]);
    expect(cuerpo.total).toBe(0);
  });

  it("#26 CA-3: un sensor de otro nodo da lista vacía, no 404", async () => {
    const { res, cuerpo } = await consultar(`nodoId=${nodoA}&sensorId=${sensorB1}`);
    expect(res.status).toBe(200);
    expect(cuerpo.items).toEqual([]);
    expect(cuerpo.total).toBe(0);
  });

  it("#26 CA-3: un nodo que no existe da lista vacía, no 404", async () => {
    const { res, cuerpo } = await consultar(`nodoId=${randomUUID()}`);
    expect(res.status).toBe(200);
    expect(cuerpo.total).toBe(0);
  });

  it("#26 CA-1: el administrador también recibe 200", async () => {
    const { res } = await consultar(`nodoId=${nodoB}`, "administrador");
    expect(res.status).toBe(200);
  });
});
