import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { conId, peticion } from "@/test/api";
import { DELETE, GET as GET_UNO, PATCH } from "../nodos/[id]/route";
import { GET, POST } from "../nodos/route";
import { POST as POST_SENSOR } from "../sensores/route";
import { GET as GET_SENSOR } from "../sensores/[id]/route";

const prefijo = `int-api-nodos-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/nodos";

const crear = async (nombre = `${prefijo}-${randomUUID().slice(0, 6)}`) =>
  (await POST(await peticion("POST", RUTA, { rol: "administrador", cuerpo: { nombre, ubicacion: "Bello" } }), undefined)).json();
const cuantos = async () => (await db().query("SELECT count(*)::int AS n FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`])).rows[0].n as number;

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API de nodos", () => {
  it("#21 CA-1: el administrador crea un nodo con 201 y estado conectado, y aparece en la lista", async () => {
    const res = await POST(await peticion("POST", RUTA, { rol: "administrador", cuerpo: { nombre: `${prefijo}-nuevo`, ubicacion: "Bello" } }), undefined);
    expect(res.status).toBe(201);
    const nodo = await res.json();
    expect(nodo).toMatchObject({ nombre: `${prefijo}-nuevo`, ubicacion: "Bello", estado: "conectado" });

    const lista = await GET(await peticion("GET", RUTA, { rol: "administrador" }), undefined);
    expect(lista.status).toBe(200);
    expect(await lista.json()).toContainEqual(nodo);
  });

  it.each([
    ["un nombre vacío", { cuerpo: { nombre: "" } }],
    ["un nombre de más de 80 caracteres", { cuerpo: { nombre: "x".repeat(81) } }],
    ["un cuerpo sin nombre", { cuerpo: { ubicacion: "Bello" } }],
    ["un cuerpo que no es JSON", { crudo: "esto no es json" }],
  ])("#21 CA-3: crear con %s responde 400 con el detalle y no guarda nada", async (_caso, cuerpo) => {
    const antes = await cuantos();
    const res = await POST(await peticion("POST", RUTA, { rol: "administrador", ...cuerpo }), undefined);
    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.error).toBe("Datos inválidos");
    expect(error.detalles.length).toBeGreaterThan(0);
    expect(await cuantos()).toBe(antes);
  });

  it("#21 CA-3: editar con datos inválidos responde 400 y el nodo conserva sus datos", async () => {
    const nodo = await crear();
    for (const cuerpo of [{ nombre: "" }, {}, { estado: "desconectado" }]) {
      const res = await PATCH(await peticion("PATCH", `${RUTA}/${nodo.id}`, { rol: "administrador", cuerpo }), conId(nodo.id));
      expect(res.status).toBe(400);
      expect((await res.json()).detalles.length).toBeGreaterThan(0);
    }
    expect(await (await GET_UNO(await peticion("GET", `${RUTA}/${nodo.id}`, { rol: "administrador" }), conId(nodo.id))).json()).toEqual(nodo);
  });

  it("#21 CA-3: editar con datos válidos responde 200 y no cambia el estado", async () => {
    const nodo = await crear();
    const res = await PATCH(
      await peticion("PATCH", `${RUTA}/${nodo.id}`, { rol: "administrador", cuerpo: { nombre: `${prefijo}-editado`, ubicacion: null } }),
      conId(nodo.id),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...nodo, nombre: `${prefijo}-editado`, ubicacion: null });
  });

  it.each([
    ["inexistente", randomUUID()],
    ["mal formado", "no-es-un-uuid"],
  ])("#21 CA-4: consultar, editar y eliminar un nodo %s responde 404", async (_caso, id) => {
    const ruta = `${RUTA}/${id}`;
    const respuestas = [
      await GET_UNO(await peticion("GET", ruta, { rol: "administrador" }), conId(id)),
      await PATCH(await peticion("PATCH", ruta, { rol: "administrador", cuerpo: { nombre: `${prefijo}-x` } }), conId(id)),
      await DELETE(await peticion("DELETE", ruta, { rol: "administrador" }), conId(id)),
    ];
    for (const res of respuestas) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Nodo no encontrado" });
    }
  });

  it("#21 CA-4: eliminar un nodo responde 204 y elimina también sus sensores", async () => {
    const nodo = await crear();
    const sensor = await (
      await POST_SENSOR(await peticion("POST", "/api/sensores", { rol: "administrador", cuerpo: { nodoId: nodo.id, nombre: "S1" } }), undefined)
    ).json();

    const res = await DELETE(await peticion("DELETE", `${RUTA}/${nodo.id}`, { rol: "administrador" }), conId(nodo.id));

    expect(res.status).toBe(204);
    expect((await GET_UNO(await peticion("GET", `${RUTA}/${nodo.id}`, { rol: "administrador" }), conId(nodo.id))).status).toBe(404);
    expect((await GET_SENSOR(await peticion("GET", `/api/sensores/${sensor.id}`, { rol: "administrador" }), conId(sensor.id))).status).toBe(404);
  });

  it("#21 CA-5: el técnico recibe 403 al crear, editar y eliminar, aunque el cuerpo sea inválido, y nada cambia", async () => {
    const nodo = await crear();
    const antes = await cuantos();
    const ruta = `${RUTA}/${nodo.id}`;
    const respuestas = [
      await POST(await peticion("POST", RUTA, { rol: "tecnico", cuerpo: { nombre: `${prefijo}-tecnico` } }), undefined),
      await POST(await peticion("POST", RUTA, { rol: "tecnico", cuerpo: { nombre: "" } }), undefined),
      await PATCH(await peticion("PATCH", ruta, { rol: "tecnico", cuerpo: { nombre: `${prefijo}-tecnico` } }), conId(nodo.id)),
      await DELETE(await peticion("DELETE", ruta, { rol: "tecnico" }), conId(nodo.id)),
    ];
    for (const res of respuestas) {
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Sin permiso" });
    }
    expect(await cuantos()).toBe(antes);
    expect(await (await GET_UNO(await peticion("GET", ruta, { rol: "tecnico" }), conId(nodo.id))).json()).toEqual(nodo);
  });

  it("#21 CA-5: el técnico sí consulta la lista y un nodo", async () => {
    const nodo = await crear();
    const lista = await GET(await peticion("GET", RUTA, { rol: "tecnico" }), undefined);
    expect(lista.status).toBe(200);
    expect(await lista.json()).toContainEqual(nodo);
    expect((await GET_UNO(await peticion("GET", `${RUTA}/${nodo.id}`, { rol: "tecnico" }), conId(nodo.id))).status).toBe(200);
  });

  it("#21 CA-5: sin sesión toda ruta de nodos responde 401 en JSON", async () => {
    const id = randomUUID();
    const respuestas = [
      await GET(await peticion("GET", RUTA), undefined),
      await POST(await peticion("POST", RUTA, { cuerpo: { nombre: `${prefijo}-anonimo` } }), undefined),
      await GET_UNO(await peticion("GET", `${RUTA}/${id}`), conId(id)),
      await PATCH(await peticion("PATCH", `${RUTA}/${id}`, { cuerpo: { nombre: "x" } }), conId(id)),
      await DELETE(await peticion("DELETE", `${RUTA}/${id}`), conId(id)),
    ];
    for (const res of respuestas) {
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "No autenticado" });
    }
  });
});
