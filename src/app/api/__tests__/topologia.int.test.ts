import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { conId, peticion } from "@/test/api";
import { DELETE } from "../topologia/enlaces/[id]/route";
import { POST } from "../topologia/enlaces/route";
import { PUT } from "../topologia/nodos/[id]/route";
import { GET } from "../topologia/route";

const prefijo = `int-api-topologia-${randomUUID().slice(0, 8)}`;
let a: string;
let b: string;
let c: string;

beforeAll(async () => {
  [a, b, c] = (await db().query("INSERT INTO nodos (nombre) VALUES ($1), ($1), ($1) RETURNING id", [prefijo])).rows.map((f) => f.id);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

const ubicar = async (id: string, cuerpo: unknown, rol: "administrador" | "tecnico" = "administrador") =>
  PUT(await peticion("PUT", `/api/topologia/nodos/${id}`, { rol, cuerpo }), conId(id));
const enlazar = async (cuerpo: unknown, rol: "administrador" | "tecnico" = "administrador") =>
  POST(await peticion("POST", "/api/topologia/enlaces", { rol, cuerpo }), undefined);
const topologia = async () => (await GET(await peticion("GET", "/api/topologia", { rol: "tecnico" }), undefined)).json();

describe("API de topología", () => {
  it("ui-scada: sin sesión, todas las rutas responden 401", async () => {
    expect((await GET(await peticion("GET", "/api/topologia"), undefined)).status).toBe(401);
    expect((await PUT(await peticion("PUT", `/api/topologia/nodos/${a}`, { cuerpo: {} }), conId(a))).status).toBe(401);
    expect((await POST(await peticion("POST", "/api/topologia/enlaces", { cuerpo: {} }), undefined)).status).toBe(401);
    expect((await DELETE(await peticion("DELETE", `/api/topologia/enlaces/${a}`), conId(a))).status).toBe(401);
  });

  it("ui-scada: el técnico lee la topología, con los nodos sin ubicar en nulo", async () => {
    const t = await topologia();
    expect(t.nodos).toContainEqual({ id: c, nombre: prefijo, estado: "conectado", tipo: null, x: null, y: null });
    expect(Array.isArray(t.enlaces)).toBe(true);
  });

  it("ui-scada: el técnico no puede mover nodos ni crear o borrar enlaces (403)", async () => {
    expect((await ubicar(a, { tipo: "carga", x: 1, y: 1 }, "tecnico")).status).toBe(403);
    expect((await enlazar({ origenId: a, destinoId: b }, "tecnico")).status).toBe(403);
    const res = await DELETE(await peticion("DELETE", `/api/topologia/enlaces/${a}`, { rol: "tecnico" }), conId(a));
    expect(res.status).toBe(403);
  });

  it("ui-scada: el administrador ubica un nodo y al moverlo otra vez se reemplaza la posición", async () => {
    const res = await ubicar(a, { tipo: "subestacion", x: 100, y: 200 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ nodoId: a, tipo: "subestacion", x: 100, y: 200 });
    await ubicar(a, { tipo: "subestacion", x: 150.5, y: 220 });
    expect((await topologia()).nodos).toContainEqual(expect.objectContaining({ id: a, tipo: "subestacion", x: 150.5, y: 220 }));
  });

  it.each([
    ["un tipo desconocido", { tipo: "nave", x: 1, y: 1 }],
    ["una coordenada fuera del lienzo", { tipo: "carga", x: 1, y: 9000 }],
  ])("ui-scada: ubicar con %s responde 400", async (_caso, cuerpo) => {
    const res = await ubicar(b, cuerpo);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Datos inválidos");
  });

  it("ui-scada: ubicar un nodo que no existe responde 404", async () => {
    const id = randomUUID();
    expect((await ubicar(id, { tipo: "carga", x: 1, y: 1 })).status).toBe(404);
  });

  it("ui-scada: el administrador crea un enlace (201), no puede repetirlo en ningún sentido (409) y lo borra (204)", async () => {
    const res = await enlazar({ origenId: a, destinoId: b });
    expect(res.status).toBe(201);
    const enlace = await res.json();
    expect(enlace).toEqual({ id: expect.any(String), origenId: a, destinoId: b });
    expect((await topologia()).enlaces).toContainEqual(enlace);

    const repetido = await enlazar({ origenId: b, destinoId: a });
    expect(repetido.status).toBe(409);
    expect(await repetido.json()).toEqual({ error: "Ya existe un enlace entre esos nodos" });

    const borrado = await DELETE(await peticion("DELETE", `/api/topologia/enlaces/${enlace.id}`, { rol: "administrador" }), conId(enlace.id));
    expect(borrado.status).toBe(204);
    expect((await topologia()).enlaces).not.toContainEqual(enlace);
  });

  it("ui-scada: un enlace de un nodo consigo mismo responde 400 y uno con un nodo inexistente, 404", async () => {
    expect((await enlazar({ origenId: a, destinoId: a })).status).toBe(400);
    expect((await enlazar({ origenId: a, destinoId: randomUUID() })).status).toBe(404);
  });

  it("ui-scada: borrar un enlace que no existe responde 404", async () => {
    const id = randomUUID();
    const res = await DELETE(await peticion("DELETE", `/api/topologia/enlaces/${id}`, { rol: "administrador" }), conId(id));
    expect(res.status).toBe(404);
  });
});
