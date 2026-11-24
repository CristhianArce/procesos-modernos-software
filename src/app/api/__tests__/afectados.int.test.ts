import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { POST } from "../afectados/route";

const prefijo = `int-api-afectados-${randomUUID().slice(0, 8)}`;
let nodoId: string;
let otroNodoId: string;

const crearNodo = async (nombre: string) => (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [nombre])).rows[0].id as string;
const alias = async (id: string) =>
  (await db().query("SELECT alias FROM nodo_usuarios WHERE nodo_id = $1 ORDER BY creado_en, id", [id])).rows.map((f) => f.alias as string);
const agregar = async (cuerpo: unknown, rol?: "administrador" | "tecnico") =>
  POST(await peticion("POST", "/api/afectados", { rol, cuerpo }), undefined);

beforeAll(async () => {
  nodoId = await crearNodo(`${prefijo}-a`);
  otroNodoId = await crearNodo(`${prefijo}-b`);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API de afectados", () => {
  it("#54 CA-1: el administrador agrega un afectado (201) y el nodo tiene uno más sin cambiar otro nodo", async () => {
    const antes = await alias(nodoId);
    const otroAntes = await alias(otroNodoId);
    const res = await agregar({ nodoId, alias: "Usuario demo 01" }, "administrador");
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: expect.any(String), nodoId, alias: "Usuario demo 01", creadoEn: expect.any(String) });
    expect(await alias(nodoId)).toEqual([...antes, "Usuario demo 01"]);
    expect(await alias(otroNodoId)).toEqual(otroAntes);
  });

  it("#54 CA-1: un alias repetido responde 201 y el nodo tiene los dos", async () => {
    const nodo = await crearNodo(`${prefijo}-repetido`);
    expect((await agregar({ nodoId: nodo, alias: "Repetido" }, "administrador")).status).toBe(201);
    expect((await agregar({ nodoId: nodo, alias: "Repetido" }, "administrador")).status).toBe(201);
    expect(await alias(nodo)).toEqual(["Repetido", "Repetido"]);
  });

  it("#54 CA-2: se recortan los espacios del alias", async () => {
    const nodo = await crearNodo(`${prefijo}-recorte`);
    const res = await agregar({ nodoId: nodo, alias: "  Usuario demo 01  " }, "administrador");
    expect(res.status).toBe(201);
    expect((await res.json()).alias).toBe("Usuario demo 01");
    expect(await alias(nodo)).toEqual(["Usuario demo 01"]);
  });

  it.each([
    ["alias vacío", (n: string) => ({ nodoId: n, alias: "" })],
    ["alias de solo espacios", (n: string) => ({ nodoId: n, alias: "   " })],
    ["alias de 101 caracteres", (n: string) => ({ nodoId: n, alias: "x".repeat(101) })],
    ["sin alias", (n: string) => ({ nodoId: n })],
    ["nodoId mal formado", () => ({ nodoId: "no-es-uuid", alias: "Valido" })],
    ["sin nodoId", () => ({ alias: "Valido" })],
  ])("#54 CA-2: %s responde 400 y no guarda nada", async (_caso, armar) => {
    const nodo = await crearNodo(`${prefijo}-400-${randomUUID().slice(0, 6)}`);
    const res = await agregar(armar(nodo), "administrador");
    expect(res.status).toBe(400);
    expect(await alias(nodo)).toEqual([]);
  });

  it("#54 CA-2: un cuerpo que no es JSON responde 400", async () => {
    const res = await POST(await peticion("POST", "/api/afectados", { rol: "administrador", crudo: "esto no es json" }), undefined);
    expect(res.status).toBe(400);
  });

  it("#54 CA-3: un UUID sin nodo responde 404 y no guarda nada", async () => {
    const id = randomUUID();
    const res = await agregar({ nodoId: id, alias: "Fantasma" }, "administrador");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Nodo no encontrado");
    expect(await alias(id)).toEqual([]);
  });

  it("#54 CA-4: el técnico recibe 403 con cuerpo válido e inválido y no se guarda nada", async () => {
    const nodo = await crearNodo(`${prefijo}-tecnico`);
    expect((await agregar({ nodoId: nodo, alias: "Valido" }, "tecnico")).status).toBe(403);
    expect((await agregar({ nodoId: nodo, alias: "" }, "tecnico")).status).toBe(403);
    expect((await POST(await peticion("POST", "/api/afectados", { rol: "tecnico", crudo: "no json" }), undefined)).status).toBe(403);
    expect(await alias(nodo)).toEqual([]);
  });

  it("#54 CA-4: sin sesión responde 401 y no se guarda nada", async () => {
    const nodo = await crearNodo(`${prefijo}-sinsesion`);
    expect((await agregar({ nodoId: nodo, alias: "Valido" })).status).toBe(401);
    expect(await alias(nodo)).toEqual([]);
  });
});
