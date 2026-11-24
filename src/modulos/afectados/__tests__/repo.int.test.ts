import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listarPorNodo } from "../repo";

const prefijo = `int-repo-afectados-${randomUUID().slice(0, 8)}`;
let nodoId: string;
let otroNodoId: string;
let vacioId: string;

const crearNodo = async (nombre: string) => (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [nombre])).rows[0].id as string;
// creado_en explícito y distinto para que el orden de creación sea determinista.
const crearAfectado = async (nodo: string, alias: string, segundos: number) =>
  (
    await db().query(
      "INSERT INTO nodo_usuarios (nodo_id, alias, creado_en) VALUES ($1, $2, now() - ($3 || ' seconds')::interval) RETURNING id",
      [nodo, alias, String(segundos)],
    )
  ).rows[0].id as string;

beforeAll(async () => {
  nodoId = await crearNodo(`${prefijo}-a`);
  otroNodoId = await crearNodo(`${prefijo}-b`);
  vacioId = await crearNodo(`${prefijo}-vacio`);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de afectados", () => {
  it("#25 CA-1: listarPorNodo devuelve id, alias y creadoEn en orden de creación, con alias repetidos", async () => {
    const tercero = await crearAfectado(nodoId, `${prefijo}-ana`, 10);
    const primero = await crearAfectado(nodoId, `${prefijo}-ana`, 30);
    const segundo = await crearAfectado(nodoId, `${prefijo}-beto`, 20);
    const lista = await listarPorNodo(nodoId);
    expect(lista.map((a) => a.id)).toEqual([primero, segundo, tercero]);
    expect(lista.map((a) => a.alias)).toEqual([`${prefijo}-ana`, `${prefijo}-beto`, `${prefijo}-ana`]);
    expect(Object.keys(lista[0]).sort()).toEqual(["alias", "creadoEn", "id"]);
    expect(Number.isNaN(Date.parse(lista[0].creadoEn))).toBe(false);
    expect(lista[0].creadoEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("#25 CA-1: listarPorNodo no trae afectados de otro nodo", async () => {
    const propio = await crearAfectado(nodoId, `${prefijo}-propio`, 5);
    const ajeno = await crearAfectado(otroNodoId, `${prefijo}-ajeno`, 5);
    const ids = (await listarPorNodo(nodoId)).map((a) => a.id);
    expect(ids).toContain(propio);
    expect(ids).not.toContain(ajeno);
    expect((await listarPorNodo(otroNodoId)).map((a) => a.id)).toEqual([ajeno]);
  });

  it("#25 CA-3: listarPorNodo devuelve una lista vacía para un nodo sin afectados", async () => {
    expect(await listarPorNodo(vacioId)).toEqual([]);
  });

  it("#25 CA-3: borrar el nodo borra sus afectados", async () => {
    const nodo = await crearNodo(`${prefijo}-borrable`);
    await crearAfectado(nodo, `${prefijo}-x`, 1);
    expect(await listarPorNodo(nodo)).toHaveLength(1);
    await db().query("DELETE FROM nodos WHERE id = $1", [nodo]);
    const { rows } = await db().query("SELECT count(*)::int AS n FROM nodo_usuarios WHERE nodo_id = $1", [nodo]);
    expect(rows[0].n).toBe(0);
  });
});
