import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET } from "../afectados/route";

const prefijo = `int-api-afectados-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/afectados";

const crearNodo = async (): Promise<string> =>
  (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-${randomUUID().slice(0, 6)}`])).rows[0].id;
// creado_en explícito y distinto: el orden de creación no depende del reloj.
const crearAfectado = async (nodoId: string, alias: string, segundos: number): Promise<string> =>
  (
    await db().query(
      "INSERT INTO nodo_usuarios (nodo_id, alias, creado_en) VALUES ($1, $2, now() - ($3 || ' seconds')::interval) RETURNING id",
      [nodoId, alias, String(segundos)],
    )
  ).rows[0].id;
const consultar = async (query: string, rol?: "administrador" | "tecnico") => GET(await peticion("GET", `${RUTA}${query}`, { rol }), undefined);

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API de afectados", () => {
  it("#25 CA-1: devuelve el total y la lista en orden de creación, con alias repetidos y sin afectados de otros nodos", async () => {
    const nodoId = await crearNodo();
    const otro = await crearNodo();
    const segundo = await crearAfectado(nodoId, "Ana", 10);
    const primero = await crearAfectado(nodoId, "Ana", 30);
    const medio = await crearAfectado(nodoId, "Beto", 20);
    await crearAfectado(otro, "Ajeno", 5);
    const res = await consultar(`?nodoId=${nodoId}`, "administrador");
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.total).toBe(3);
    expect(cuerpo.afectados.map((a: { id: string }) => a.id)).toEqual([primero, medio, segundo]);
    expect(cuerpo.afectados.map((a: { alias: string }) => a.alias)).toEqual(["Ana", "Beto", "Ana"]);
    expect(Object.keys(cuerpo.afectados[0]).sort()).toEqual(["alias", "creadoEn", "id"]);
    expect(cuerpo.total).toBe(cuerpo.afectados.length);
  });

  it("#25 CA-2: el administrador y el técnico reciben 200 con el mismo total y la misma lista", async () => {
    const nodoId = await crearNodo();
    await crearAfectado(nodoId, "Uno", 20);
    await crearAfectado(nodoId, "Dos", 10);
    const admin = await consultar(`?nodoId=${nodoId}`, "administrador");
    const tecnico = await consultar(`?nodoId=${nodoId}`, "tecnico");
    expect(admin.status).toBe(200);
    expect(tecnico.status).toBe(200);
    const [a, t] = [await admin.json(), await tecnico.json()];
    expect(a.total).toBe(2);
    expect(t).toEqual(a);
  });

  it("#25 CA-3: un nodo sin afectados responde 200 con total 0 y lista vacía", async () => {
    const nodoId = await crearNodo();
    const res = await consultar(`?nodoId=${nodoId}`, "tecnico");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 0, afectados: [] });
  });

  it("#25 CA-3: un UUID inexistente responde 404 «Nodo no encontrado»", async () => {
    const res = await consultar(`?nodoId=${randomUUID()}`, "administrador");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Nodo no encontrado" });
  });

  it.each([
    ["sin nodoId", ""],
    ["con nodoId vacío", "?nodoId="],
    ["con un nodoId que no es UUID", "?nodoId=no-es-un-uuid"],
  ])("#25 CA-3: consultar %s responde 400 con el detalle", async (_caso, query) => {
    const res = await consultar(query, "administrador");
    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.error).toBe("Datos inválidos");
    expect(error.detalles.length).toBeGreaterThan(0);
  });

  it("#25 CA-2: sin sesión responde 401 en JSON", async () => {
    const nodoId = await crearNodo();
    await crearAfectado(nodoId, "Oculto", 1);
    const res = await consultar(`?nodoId=${nodoId}`);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });
});
