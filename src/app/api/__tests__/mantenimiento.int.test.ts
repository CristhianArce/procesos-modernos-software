import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { conId, peticion } from "@/test/api";
import { PUT } from "../mantenimiento/nodos/[id]/tecnico/route";

const prefijo = `int-api-mant-${randomUUID().slice(0, 8)}`;
const ruta = (id: string) => `/api/mantenimiento/nodos/${id}/tecnico`;

const crearNodo = async (): Promise<string> =>
  (await db().query("INSERT INTO nodos (nombre, ubicacion) VALUES ($1, 'Bello') RETURNING id", [`${prefijo}-${randomUUID().slice(0, 6)}`])).rows[0].id;
const crearUsuario = async (rol: "administrador" | "tecnico"): Promise<{ id: string; nombreUsuario: string }> => {
  const nombreUsuario = `${prefijo}-${randomUUID().slice(0, 6)}`;
  const { rows } = await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'x', $2) RETURNING id", [nombreUsuario, rol]);
  return { id: rows[0].id, nombreUsuario };
};
const asignado = async (nodoId: string): Promise<string[]> =>
  (await db().query("SELECT tecnico_id FROM nodo_tecnicos WHERE nodo_id = $1", [nodoId])).rows.map((r) => r.tecnico_id);
const asignar = async (id: string, rol: "administrador" | "tecnico" | undefined, cuerpo?: unknown) =>
  PUT(await peticion("PUT", ruta(id), { rol, cuerpo }), conId(id));

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API de asignación de técnicos", () => {
  it("#27 CA-1: el administrador asigna un técnico con 200 y { nodoId, tecnico }", async () => {
    const [nodo, tecnico] = [await crearNodo(), await crearUsuario("tecnico")];
    const res = await asignar(nodo, "administrador", { tecnicoId: tecnico.id });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ nodoId: nodo, tecnico });
    expect(await asignado(nodo)).toEqual([tecnico.id]);
  });

  it("#27 CA-1: reasignar reemplaza al técnico anterior", async () => {
    const nodo = await crearNodo();
    const [a, b] = [await crearUsuario("tecnico"), await crearUsuario("tecnico")];
    await asignar(nodo, "administrador", { tecnicoId: a.id });
    const res = await asignar(nodo, "administrador", { tecnicoId: b.id });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ nodoId: nodo, tecnico: b });
    expect(await asignado(nodo)).toEqual([b.id]);
  });

  it("#27 CA-2: un usuario administrador responde 400 «El usuario no es técnico» y la asignación no cambia", async () => {
    const [nodo, tecnico, admin] = [await crearNodo(), await crearUsuario("tecnico"), await crearUsuario("administrador")];
    await asignar(nodo, "administrador", { tecnicoId: tecnico.id });
    const res = await asignar(nodo, "administrador", { tecnicoId: admin.id });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "El usuario no es técnico" });
    expect(await asignado(nodo)).toEqual([tecnico.id]);
  });

  it("#27 CA-2: un UUID sin usuario responde 404 «Usuario no encontrado» y la asignación no cambia", async () => {
    const [nodo, tecnico] = [await crearNodo(), await crearUsuario("tecnico")];
    await asignar(nodo, "administrador", { tecnicoId: tecnico.id });
    const res = await asignar(nodo, "administrador", { tecnicoId: randomUUID() });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Usuario no encontrado" });
    expect(await asignado(nodo)).toEqual([tecnico.id]);
  });

  it.each([
    ["sin tecnicoId", { cuerpo: {} }],
    ["con un tecnicoId mal formado", { cuerpo: { tecnicoId: "no-es-uuid" } }],
    ["que no es JSON", { crudo: "esto no es json" }],
  ])("#27 CA-2: un cuerpo %s responde 400 con detalles y la asignación no cambia", async (_caso, entrada) => {
    const [nodo, tecnico] = [await crearNodo(), await crearUsuario("tecnico")];
    await asignar(nodo, "administrador", { tecnicoId: tecnico.id });
    const res = await PUT(await peticion("PUT", ruta(nodo), { rol: "administrador", ...entrada }), conId(nodo));
    expect(res.status).toBe(400);
    expect((await res.json()).detalles.length).toBeGreaterThan(0);
    expect(await asignado(nodo)).toEqual([tecnico.id]);
  });

  it.each([
    ["un nodo inexistente", () => randomUUID()],
    ["un nodo mal formado", () => "no-es-uuid"],
  ])("#27 CA-3: %s responde 404 «Nodo no encontrado»", async (_caso, id) => {
    const tecnico = await crearUsuario("tecnico");
    const res = await asignar(id(), "administrador", { tecnicoId: tecnico.id });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Nodo no encontrado" });
  });

  it("#27 CA-4: el técnico recibe 403 con cuerpo válido e inválido y la asignación no cambia", async () => {
    const [nodo, tecnico, otro] = [await crearNodo(), await crearUsuario("tecnico"), await crearUsuario("tecnico")];
    await asignar(nodo, "administrador", { tecnicoId: tecnico.id });
    for (const cuerpo of [{ tecnicoId: otro.id }, { tecnicoId: "no-es-uuid" }]) {
      const res = await asignar(nodo, "tecnico", cuerpo);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Sin permiso" });
    }
    expect(await asignado(nodo)).toEqual([tecnico.id]);
  });

  it("#27 CA-4: sin sesión responde 401 en JSON y no asigna", async () => {
    const [nodo, tecnico] = [await crearNodo(), await crearUsuario("tecnico")];
    const res = await asignar(nodo, undefined, { tecnicoId: tecnico.id });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "No autenticado" });
    expect(await asignado(nodo)).toEqual([]);
  });
});
