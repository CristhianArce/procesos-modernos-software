import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../route";

const prefijo = `int-api-historico-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/historico";
let sensorId: string;
let sensorVacio: string;

beforeAll(async () => {
  const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  const { rows } = await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's'), ($1, 'vacio') RETURNING id, nombre", [nodoId]);
  sensorId = rows.find((f) => f.nombre === "s").id;
  sensorVacio = rows.find((f) => f.nombre === "vacio").id;
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
     SELECT $1::uuid, 120, 1, 120, '2001-01-01T00:00:00Z'::timestamptz + make_interval(mins => m) FROM generate_series(0, 25) AS m`,
    [sensorId],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("API del histórico", () => {
  it("#26 CA-5: sin sesión responde 401 en JSON", async () => {
    const res = await GET(await peticion("GET", RUTA), undefined);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it.each([
    ["fecha mal formada", "desde=ayer"],
    ["rango invertido", "desde=2001-01-02T00:00:00Z&hasta=2001-01-01T00:00:00Z"],
    ["nodoId que no es UUID", "nodoId=abc"],
    ["sensorId que no es UUID", "sensorId=abc"],
    ["página 0", "pagina=0"],
    ["página no numérica", "pagina=x"],
  ])("#26 CA-4: %s responde 400 en JSON", async (_caso, consulta) => {
    const res = await GET(await peticion("GET", `${RUTA}?${consulta}`, { rol: "administrador" }), undefined);
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("#26 CA-1: el administrador recibe la página 1 con 25 items, pagina, tamano y total", async () => {
    const res = await GET(await peticion("GET", `${RUTA}?sensorId=${sensorId}`, { rol: "administrador" }), undefined);

    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo).toMatchObject({ pagina: 1, tamano: 25, total: 26 });
    expect(cuerpo.items).toHaveLength(25);
    expect(cuerpo.items[0]).toMatchObject({ sensorId, sensorNombre: "s", nodoNombre: prefijo, tomadaEn: "2001-01-01T00:25:00.000Z" });
    const fechas = cuerpo.items.map((i: { tomadaEn: string }) => i.tomadaEn);
    expect([...fechas].sort().reverse()).toEqual(fechas);
  });

  it("#26 CA-1: el técnico pide la página 2 y recibe la lectura más antigua", async () => {
    const res = await GET(await peticion("GET", `${RUTA}?sensorId=${sensorId}&pagina=2`, { rol: "tecnico" }), undefined);

    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo).toMatchObject({ pagina: 2, tamano: 25, total: 26 });
    expect(cuerpo.items.map((i: { tomadaEn: string }) => i.tomadaEn)).toEqual(["2001-01-01T00:00:00.000Z"]);
  });

  it("#26 CA-2: el rango incluye desde y excluye hasta", async () => {
    const consulta = `sensorId=${sensorId}&desde=2001-01-01T00:10:00Z&hasta=2001-01-01T00:12:00Z`;
    const res = await GET(await peticion("GET", `${RUTA}?${consulta}`, { rol: "administrador" }), undefined);

    const cuerpo = await res.json();
    expect(cuerpo.total).toBe(2);
    expect(cuerpo.items.map((i: { tomadaEn: string }) => i.tomadaEn)).toEqual(["2001-01-01T00:11:00.000Z", "2001-01-01T00:10:00.000Z"]);
  });

  it("#26 CA-3: un sensor sin lecturas responde 200 con items vacío y total 0", async () => {
    const res = await GET(await peticion("GET", `${RUTA}?sensorId=${sensorVacio}`, { rol: "administrador" }), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], pagina: 1, tamano: 25, total: 0 });
  });
});
