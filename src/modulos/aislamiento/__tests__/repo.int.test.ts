import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { buscar, crear } from "@/modulos/nodos/repo";
import { cambiarEstado } from "../repo";

const prefijo = `int-repo-aislamiento-${randomUUID().slice(0, 8)}`;

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de aislamiento", () => {
  it("#23 CA-1: cambiarEstado pone desconectado y luego conectado, y devuelve id y estado", async () => {
    const nodo = await crear({ nombre: `${prefijo}-a`, ubicacion: "Bello" });
    expect(await cambiarEstado(nodo.id, "desconectado")).toEqual({ id: nodo.id, estado: "desconectado" });
    expect((await buscar(nodo.id))?.estado).toBe("desconectado");
    expect(await cambiarEstado(nodo.id, "conectado")).toEqual({ id: nodo.id, estado: "conectado" });
    expect((await buscar(nodo.id))?.estado).toBe("conectado");
  });

  it("#23 CA-2: repetir el destino devuelve el mismo estado", async () => {
    const nodo = await crear({ nombre: `${prefijo}-b` });
    await cambiarEstado(nodo.id, "desconectado");
    expect(await cambiarEstado(nodo.id, "desconectado")).toEqual({ id: nodo.id, estado: "desconectado" });
  });

  it("#23 CA-4: devuelve null si el nodo no existe", async () => {
    expect(await cambiarEstado(randomUUID(), "desconectado")).toBeNull();
  });

  it("#23 CA-1: solo cambia el estado del nodo indicado: ni sus otras columnas ni los demás nodos", async () => {
    const [nodo, otro] = [await crear({ nombre: `${prefijo}-c`, ubicacion: "Itagüí" }), await crear({ nombre: `${prefijo}-d` })];
    await cambiarEstado(nodo.id, "desconectado");
    expect(await buscar(nodo.id)).toEqual({ ...nodo, estado: "desconectado" });
    expect(await buscar(otro.id)).toEqual(otro);
  });
});
