import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { crear, listarPorNodo } from "../repo";

const prefijo = `int-repo-afectados-${randomUUID().slice(0, 8)}`;
let nodoId: string;
let otroNodoId: string;

const crearNodo = async (nombre: string) => (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [nombre])).rows[0].id as string;

beforeAll(async () => {
  nodoId = await crearNodo(`${prefijo}-a`);
  otroNodoId = await crearNodo(`${prefijo}-b`);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de afectados", () => {
  it("#54 CA-1: crear devuelve id, nodoId, alias y creadoEn", async () => {
    const afectado = await crear({ nodoId, alias: "Usuario demo 01" });
    expect(afectado).toEqual({ id: expect.any(String), nodoId, alias: "Usuario demo 01", creadoEn: expect.anything() });
  });

  it("#54 CA-1: listarPorNodo devuelve los afectados del nodo en orden de alta y no los de otro nodo", async () => {
    const primero = await crear({ nodoId: otroNodoId, alias: "Orden 1" });
    const segundo = await crear({ nodoId: otroNodoId, alias: "Orden 2" });
    const ajeno = await crear({ nodoId, alias: "Ajeno" });
    const lista = await listarPorNodo(otroNodoId);
    expect(lista.map((a) => a.id)).toEqual([primero.id, segundo.id]);
    expect(lista.map((a) => a.id)).not.toContain(ajeno.id);
  });

  it("#54 CA-1: un alias repetido se guarda dos veces en el mismo nodo", async () => {
    const nodo = await crearNodo(`${prefijo}-c`);
    await crear({ nodoId: nodo, alias: "Repetido" });
    await crear({ nodoId: nodo, alias: "Repetido" });
    const lista = await listarPorNodo(nodo);
    expect(lista.map((a) => a.alias)).toEqual(["Repetido", "Repetido"]);
  });

  it("#54 CA-1: borrar el nodo borra sus afectados", async () => {
    const nodo = await crearNodo(`${prefijo}-d`);
    await crear({ nodoId: nodo, alias: "Se va con el nodo" });
    expect(await listarPorNodo(nodo)).toHaveLength(1);
    await db().query("DELETE FROM nodos WHERE id = $1", [nodo]);
    expect(await listarPorNodo(nodo)).toEqual([]);
    const { rows } = await db().query("SELECT 1 FROM nodo_usuarios WHERE nodo_id = $1", [nodo]);
    expect(rows).toHaveLength(0);
  });

  it("#54 CA-2: la tabla rechaza un alias vacío o de más de 100 caracteres", async () => {
    await expect(crear({ nodoId, alias: "" })).rejects.toThrow();
    await expect(crear({ nodoId, alias: "x".repeat(101) })).rejects.toThrow();
  });
});
