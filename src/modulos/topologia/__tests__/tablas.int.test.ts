import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `int-tablas-topologia-${randomUUID().slice(0, 8)}`;
const q = (sql: string, p: unknown[] = []) => db().query(sql, p);
const nodo = async () => (await q("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id as string;

afterAll(async () => {
  await q("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("tablas nodo_topologia y enlaces", () => {
  it("ui-scada: la posición de un nodo exige un nodo existente, un tipo conocido y coordenadas dentro del lienzo", async () => {
    const id = await nodo();
    await expect(q("INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES ($1, 'subestacion', 10, 20)", [id])).resolves.toBeDefined();
    await expect(q("INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES ($1, 'carga', 1, 1)", [randomUUID()])).rejects.toThrow(/foreign key/i);
    const otro = await nodo();
    await expect(q("INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES ($1, 'nave', 1, 1)", [otro])).rejects.toThrow(/check/i);
    await expect(q("INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES ($1, 'carga', -1, 1)", [otro])).rejects.toThrow(/check/i);
    await expect(q("INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES ($1, 'carga', 1, 5000)", [otro])).rejects.toThrow(/check/i);
  });

  it("ui-scada: un enlace no puede unir un nodo consigo mismo", async () => {
    const id = await nodo();
    await expect(q("INSERT INTO enlaces (origen_id, destino_id) VALUES ($1, $1)", [id])).rejects.toThrow(/check/i);
  });

  it("ui-scada: no hay dos enlaces entre el mismo par de nodos, en ningún sentido", async () => {
    const [a, b] = [await nodo(), await nodo()];
    await q("INSERT INTO enlaces (origen_id, destino_id) VALUES ($1, $2)", [a, b]);
    await expect(q("INSERT INTO enlaces (origen_id, destino_id) VALUES ($1, $2)", [a, b])).rejects.toThrow(/unique|duplicate/i);
    await expect(q("INSERT INTO enlaces (origen_id, destino_id) VALUES ($1, $2)", [b, a])).rejects.toThrow(/unique|duplicate/i);
  });

  it("ui-scada: borrar un nodo borra su posición y sus enlaces", async () => {
    const [a, b] = [await nodo(), await nodo()];
    await q("INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES ($1, 'carga', 1, 1)", [a]);
    await q("INSERT INTO enlaces (origen_id, destino_id) VALUES ($1, $2)", [b, a]);
    await q("DELETE FROM nodos WHERE id = $1", [a]);
    expect((await q("SELECT count(*)::int AS n FROM nodo_topologia WHERE nodo_id = $1", [a])).rows[0].n).toBe(0);
    expect((await q("SELECT count(*)::int AS n FROM enlaces WHERE origen_id = $1 OR destino_id = $1", [a])).rows[0].n).toBe(0);
  });
});
