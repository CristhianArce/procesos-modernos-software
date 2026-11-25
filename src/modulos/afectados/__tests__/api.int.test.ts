import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET, POST } from "@/app/api/afectados/route";

const prefijo = `int-api-afectados-alta-${randomUUID().slice(0, 8)}`;
let nodo: string;
let otroNodo: string;

beforeAll(async () => {
  [nodo, otroNodo] = (await db().query("INSERT INTO nodos (nombre) VALUES ($1), ($1) RETURNING id", [prefijo])).rows.map((f) => f.id);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

type Rol = "administrador" | "tecnico";

const agregar = async (cuerpo: unknown, rol?: Rol) => POST(await peticion("POST", "/api/afectados", { rol, cuerpo }), undefined);
const agregarCrudo = async (crudo: string, rol?: Rol) => POST(await peticion("POST", "/api/afectados", { rol, crudo }), undefined);
const consultar = async (nodoId: string) => {
  const res = await GET(await peticion("GET", `/api/afectados?nodoId=${nodoId}`, { rol: "administrador" }), undefined);
  return (await res.json()) as { total: number; afectados: { id: string; alias: string }[] };
};
const total = async (nodoId: string) => (await consultar(nodoId)).total;

describe("POST /api/afectados", () => {
  it("#54 CA-1: el administrador recibe 201 con { id, alias } y el GET refleja el total", async () => {
    const antes = await total(nodo);
    const res = await agregar({ nodoId: nodo, alias: `Usuario demo ${prefijo}` }, "administrador");
    expect(res.status).toBe(201);
    const cuerpo = await res.json();
    expect(cuerpo).toEqual({ id: expect.any(String), alias: `Usuario demo ${prefijo}` });
    const despues = await consultar(nodo);
    expect(despues.total).toBe(antes + 1);
    expect(despues.afectados).toContainEqual(cuerpo);
  });

  it("#54 CA-1: el afectado es de un solo nodo", async () => {
    const antesOtro = await consultar(otroNodo);
    const res = await agregar({ nodoId: nodo, alias: `Solo nodo ${prefijo}` }, "administrador");
    expect(res.status).toBe(201);
    expect(await consultar(otroNodo)).toEqual(antesOtro);
  });

  it("#54 CA-1: el mismo alias dos veces en el nodo responde 201 las dos veces y cuenta dos", async () => {
    const antes = await total(otroNodo);
    const a = await agregar({ nodoId: otroNodo, alias: `Repetido ${prefijo}` }, "administrador");
    const b = await agregar({ nodoId: otroNodo, alias: `Repetido ${prefijo}` }, "administrador");
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    const lista = await consultar(otroNodo);
    expect(lista.total).toBe(antes + 2);
    expect(lista.afectados.filter((x) => x.alias === `Repetido ${prefijo}`)).toHaveLength(2);
  });

  it("#54 CA-2: guarda el alias recortado", async () => {
    const res = await agregar({ nodoId: nodo, alias: `  Recortado ${prefijo}  ` }, "administrador");
    expect(res.status).toBe(201);
    expect((await res.json()).alias).toBe(`Recortado ${prefijo}`);
  });

  it("#54 CA-2: un alias de 80 caracteres se acepta", async () => {
    const res = await agregar({ nodoId: nodo, alias: "a".repeat(80) }, "administrador");
    expect(res.status).toBe(201);
  });

  it.each([
    ["vacío", ""],
    ["solo espacios", "   "],
    ["de 81 caracteres", "a".repeat(81)],
  ])("#54 CA-2: un alias %s responde 400 con detalle y no guarda", async (_caso, alias) => {
    const antes = await total(nodo);
    const res = await agregar({ nodoId: nodo, alias }, "administrador");
    expect(res.status).toBe(400);
    const cuerpo = await res.json();
    expect(cuerpo.error).toBe("Datos inválidos");
    expect(cuerpo.detalles).toBeDefined();
    expect(await total(nodo)).toBe(antes);
  });

  it.each([
    ["un nodoId que no es UUID", { nodoId: "abc", alias: "Valido" }],
    ["sin nodoId", { alias: "Valido" }],
    ["sin alias", { nodoId: "00000000-0000-4000-8000-000000000001" }],
  ])("#54 CA-2: %s responde 400 y no guarda", async (_caso, cuerpo) => {
    const antes = await total(nodo);
    const res = await agregar(cuerpo, "administrador");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Datos inválidos");
    expect(await total(nodo)).toBe(antes);
  });

  it("#54 CA-2: un cuerpo que no es JSON responde 400 y no guarda", async () => {
    const antes = await total(nodo);
    const res = await agregarCrudo("esto no es json", "administrador");
    expect(res.status).toBe(400);
    expect(await total(nodo)).toBe(antes);
  });

  it("#54 CA-3: un UUID sin nodo responde 404 en JSON y no guarda", async () => {
    const inexistente = randomUUID();
    const res = await agregar({ nodoId: inexistente, alias: "Huerfano" }, "administrador");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Nodo no encontrado" });
    const huerfanos = await db().query("SELECT 1 FROM nodo_usuarios WHERE nodo_id = $1", [inexistente]);
    expect(huerfanos.rowCount).toBe(0);
  });

  it.each([
    ["datos válidos", () => ({ nodoId: nodo, alias: `Tecnico ${prefijo}` })],
    ["datos inválidos", () => ({ nodoId: "abc", alias: "" })],
  ])("#54 CA-4: un técnico con %s recibe 403 en JSON y no guarda", async (_caso, cuerpo) => {
    const antes = await total(nodo);
    const res = await agregar(cuerpo(), "tecnico");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: expect.any(String) });
    expect(await total(nodo)).toBe(antes);
  });

  it("#54 CA-4: sin sesión responde 401 en JSON y no guarda", async () => {
    const antes = await total(nodo);
    const res = await agregar({ nodoId: nodo, alias: `Anonimo ${prefijo}` });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: expect.any(String) });
    expect(await total(nodo)).toBe(antes);
  });

  it("#54 CA-4: sin sesión y con cuerpo inválido responde 401 antes de validar", async () => {
    const res = await agregar({ nodoId: "abc", alias: "" });
    expect(res.status).toBe(401);
  });
});
