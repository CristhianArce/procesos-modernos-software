import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { conId, peticion } from "@/test/api";
import { GET as GET_NODO } from "../nodos/[id]/route";
import { POST as SIMULAR } from "../simulador/route";
import { PATCH } from "../aislamiento/nodos/[id]/route";

const prefijo = `int-api-aislamiento-${randomUUID().slice(0, 8)}`;
const ruta = (id: string) => `/api/aislamiento/nodos/${id}`;

const crearNodo = async (): Promise<string> =>
  (await db().query("INSERT INTO nodos (nombre, ubicacion) VALUES ($1, 'Bello') RETURNING id", [`${prefijo}-${randomUUID().slice(0, 6)}`])).rows[0].id;
const nodoDe = async (id: string) => (await GET_NODO(await peticion("GET", `/api/nodos/${id}`, { rol: "tecnico" }), conId(id))).json();
const cambiar = async (id: string, rol: "administrador" | "tecnico" | undefined, cuerpo?: unknown) =>
  PATCH(await peticion("PATCH", ruta(id), { rol, cuerpo }), conId(id));

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API de aislamiento", () => {
  it("#23 CA-1: el administrador aísla un nodo conectado con 200 y el nodo queda desconectado", async () => {
    const id = await crearNodo();
    const res = await cambiar(id, "administrador", { estado: "desconectado" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id, estado: "desconectado" });
    expect((await nodoDe(id)).estado).toBe("desconectado");
  });

  it("#23 CA-2: el administrador reconecta un nodo desconectado con 200 y el nodo vuelve a conectado", async () => {
    const id = await crearNodo();
    await cambiar(id, "administrador", { estado: "desconectado" });
    const res = await cambiar(id, "administrador", { estado: "conectado" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id, estado: "conectado" });
    expect((await nodoDe(id)).estado).toBe("conectado");
  });

  it("#23 CA-1: pedir el estado que el nodo ya tiene responde 200 sin cambiarlo", async () => {
    const id = await crearNodo();
    const res = await cambiar(id, "administrador", { estado: "conectado" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id, estado: "conectado" });
    await cambiar(id, "administrador", { estado: "desconectado" });
    expect((await cambiar(id, "administrador", { estado: "desconectado" })).status).toBe(200);
    expect((await nodoDe(id)).estado).toBe("desconectado");
  });

  it("#23 CA-1: solo cambia el estado del nodo indicado, no su nombre ni su ubicación ni los demás nodos", async () => {
    const [id, otro] = [await crearNodo(), await crearNodo()];
    const antes = await nodoDe(id);
    const otroAntes = await nodoDe(otro);
    await cambiar(id, "administrador", { estado: "desconectado" });
    expect(await nodoDe(id)).toEqual({ ...antes, estado: "desconectado" });
    expect(await nodoDe(otro)).toEqual(otroAntes);
  });

  it.each([
    ["un estado inválido", { cuerpo: { estado: "apagado" } }],
    ["un cuerpo sin estado", { cuerpo: {} }],
    ["un cuerpo que no es JSON", { crudo: "esto no es json" }],
  ])("#23 CA-1: pedir %s responde 400 con el detalle y el nodo conserva su estado", async (_caso, entrada) => {
    const id = await crearNodo();
    const res = await PATCH(await peticion("PATCH", ruta(id), { rol: "administrador", ...entrada }), conId(id));
    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.error).toBe("Datos inválidos");
    expect(error.detalles.length).toBeGreaterThan(0);
    expect((await nodoDe(id)).estado).toBe("conectado");
  });

  it("#23 CA-3: el técnico recibe 403 con un cuerpo válido o inválido y el nodo no cambia", async () => {
    const id = await crearNodo();
    for (const cuerpo of [{ estado: "desconectado" }, { estado: "apagado" }, undefined]) {
      const res = await cambiar(id, "tecnico", cuerpo);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Sin permiso" });
    }
    expect((await nodoDe(id)).estado).toBe("conectado");
  });

  it("#23 CA-3: sin sesión responde 401 en JSON y el nodo no cambia", async () => {
    const id = await crearNodo();
    const res = await cambiar(id, undefined, { estado: "desconectado" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "No autenticado" });
    expect((await nodoDe(id)).estado).toBe("conectado");
  });

  it.each([
    ["inexistente", randomUUID()],
    ["mal formado", "no-es-un-uuid"],
  ])("#23 CA-4: un nodo %s responde 404 y el estado de los demás nodos no cambia", async (_caso, inexistente) => {
    const otro = await crearNodo();
    const res = await cambiar(inexistente, "administrador", { estado: "desconectado" });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Nodo no encontrado" });
    expect((await nodoDe(otro)).estado).toBe("conectado");
  });

  it("#23 CA-1: un nodo aislado sigue recibiendo lecturas simuladas (RN-3)", async () => {
    const id = await crearNodo();
    await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a')", [id]);
    await cambiar(id, "administrador", { estado: "desconectado" });
    const res = await SIMULAR(await peticion("POST", "/api/simulador", { rol: "administrador", cuerpo: { nodoId: id } }), undefined);
    expect(res.status).toBe(200);
    expect((await res.json()).lecturas).toHaveLength(1);
  });
});
