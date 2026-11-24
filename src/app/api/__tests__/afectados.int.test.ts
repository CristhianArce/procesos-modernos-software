import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../afectados/route";

const prefijo = `int-api-afectados-${randomUUID().slice(0, 8)}`;
let conDatos: string;
let vacio: string;

beforeAll(async () => {
  [conDatos, vacio] = (await db().query("INSERT INTO nodos (nombre) VALUES ($1), ($1) RETURNING id", [prefijo])).rows.map((f) => f.id);
  await db().query(
    "INSERT INTO nodo_usuarios (nodo_id, alias) VALUES ($1, $2), ($1, $3), ($1, $2)",
    [conDatos, `Beta ${prefijo}`, `Alfa ${prefijo}`],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

const consultar = async (query: string, rol?: "administrador" | "tecnico") =>
  GET(await peticion("GET", `/api/afectados${query}`, { rol }), undefined);

describe("API de afectados", () => {
  it.each(["administrador", "tecnico"] as const)("#25 CA-2: el %s recibe 200 con el total y la lista ordenada por alias", async (rol) => {
    const res = await consultar(`?nodoId=${conDatos}`, rol);
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.total).toBe(3);
    expect(cuerpo.afectados.map((a: { alias: string }) => a.alias)).toEqual([`Alfa ${prefijo}`, `Beta ${prefijo}`, `Beta ${prefijo}`]);
    expect(cuerpo.afectados[0]).toEqual({ id: expect.any(String), alias: `Alfa ${prefijo}` });
  });

  it("#25 CA-2: administrador y técnico reciben la misma respuesta", async () => {
    const a = await (await consultar(`?nodoId=${conDatos}`, "administrador")).json();
    const t = await (await consultar(`?nodoId=${conDatos}`, "tecnico")).json();
    expect(a.total).toBeGreaterThan(0);
    expect(t).toEqual(a);
  });

  it("#25 CA-3: un nodo sin afectados responde 200 con lista vacía y total 0", async () => {
    const res = await consultar(`?nodoId=${vacio}`, "tecnico");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 0, afectados: [] });
  });

  it("#25 CA-3: un UUID inexistente responde 404 Nodo no encontrado", async () => {
    const res = await consultar(`?nodoId=${randomUUID()}`, "administrador");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Nodo no encontrado" });
  });

  it.each([
    ["un nodoId que no es UUID", "?nodoId=abc"],
    ["un nodoId vacío", "?nodoId="],
    ["sin nodoId", ""],
  ])("#25 CA-3: %s responde 400 con detalles", async (_caso, query) => {
    const res = await consultar(query, "administrador");
    expect(res.status).toBe(400);
    const cuerpo = await res.json();
    expect(cuerpo.error).toEqual(expect.any(String));
    expect(cuerpo.detalles).toBeDefined();
  });

  it("#25 CA-2: sin sesión responde 401 en JSON", async () => {
    const res = await consultar(`?nodoId=${conDatos}`);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });
});
