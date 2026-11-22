import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { actualizar, buscar, crear, eliminar, listar } from "../repo";

const prefijo = `int-repo-nodos-${randomUUID().slice(0, 8)}`;

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de nodos", () => {
  it("#21 CA-1: crear devuelve el nodo con estado conectado y listar lo incluye", async () => {
    const nodo = await crear({ nombre: `${prefijo}-a`, ubicacion: "Bello" });
    expect(nodo).toMatchObject({ nombre: `${prefijo}-a`, ubicacion: "Bello", estado: "conectado" });
    expect(nodo.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await listar()).toContainEqual(nodo);
  });

  it("#21 CA-1: sin ubicación queda en null", async () => {
    expect((await crear({ nombre: `${prefijo}-b` })).ubicacion).toBeNull();
  });

  it("#21 CA-4: buscar devuelve el nodo, o null si no existe", async () => {
    const nodo = await crear({ nombre: `${prefijo}-c` });
    expect(await buscar(nodo.id)).toEqual(nodo);
    expect(await buscar(randomUUID())).toBeNull();
  });

  it("#21 CA-4: actualizar cambia solo los campos enviados y conserva el estado", async () => {
    const nodo = await crear({ nombre: `${prefijo}-d`, ubicacion: "Itagüí" });
    expect(await actualizar(nodo.id, { nombre: `${prefijo}-d2` })).toMatchObject({ nombre: `${prefijo}-d2`, ubicacion: "Itagüí", estado: "conectado" });
    expect(await actualizar(nodo.id, { ubicacion: null })).toMatchObject({ nombre: `${prefijo}-d2`, ubicacion: null });
    expect(await actualizar(randomUUID(), { nombre: `${prefijo}-x` })).toBeNull();
  });

  it("#21 CA-4: eliminar devuelve si el nodo existía", async () => {
    const nodo = await crear({ nombre: `${prefijo}-e` });
    expect(await eliminar(nodo.id)).toBe(true);
    expect(await eliminar(nodo.id)).toBe(false);
    expect(await buscar(nodo.id)).toBeNull();
  });
});
