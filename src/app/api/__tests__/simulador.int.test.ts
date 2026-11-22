import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { peticion } from "@/test/api";
import { GET as GET_SENSORES } from "../sensores/route";
import { POST } from "../simulador/route";

const prefijo = `int-api-simulador-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/simulador";
let conSensores: string;
let sinSensores: string;

const crearNodo = async (nombre: string) => (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [nombre])).rows[0].id as string;
const simular = async (nodoId: string) => POST(await peticion("POST", RUTA, { rol: "administrador", cuerpo: { nodoId } }), undefined);
const sensoresDe = async (nodoId: string, rol: "administrador" | "tecnico" = "administrador") =>
  (await GET_SENSORES(await peticion("GET", `/api/sensores?nodoId=${nodoId}`, { rol }), undefined)).json();
const lecturasDe = async (nodoId: string) =>
  (await db().query("SELECT count(*)::int AS n FROM lecturas l JOIN sensores s ON s.id = l.sensor_id WHERE s.nodo_id = $1", [nodoId])).rows[0].n as number;

beforeAll(async () => {
  conSensores = await crearNodo(`${prefijo}-con`);
  sinSensores = await crearNodo(`${prefijo}-sin`);
  await db().query("INSERT INTO sensores (nodo_id, nombre, umbral_voltaje) VALUES ($1, 'a', 125), ($1, 'b', NULL)", [conSensores]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API del simulador", () => {
  it("#21 CA-6: registra una lectura de voltaje, corriente y potencia por cada sensor del nodo", async () => {
    const antes = await lecturasDe(conSensores);
    const sensores = await sensoresDe(conSensores);

    const res = await simular(conSensores);

    expect(res.status).toBe(200);
    const { lecturas } = await res.json();
    expect(lecturas).toHaveLength(2);
    expect(lecturas.map((l: { sensorId: string }) => l.sensorId).sort()).toEqual(sensores.map((s: { id: string }) => s.id).sort());
    for (const lectura of lecturas) {
      expect(lectura.voltaje).toBeGreaterThan(0);
      expect(lectura.corriente).toBeGreaterThan(0);
      expect(lectura.potencia).toBeGreaterThan(0);
    }
    expect(await lecturasDe(conSensores)).toBe(antes + 2);
  });

  it("#21 CA-6: tras dos simulaciones, cada sensor trae en ultimaLectura la de la segunda", async () => {
    await simular(conSensores);
    const { lecturas } = await (await simular(conSensores)).json();

    const sensores = await sensoresDe(conSensores);

    expect(sensores).toHaveLength(2);
    for (const sensor of sensores) {
      expect(sensor.ultimaLectura).toEqual(lecturas.find((l: { sensorId: string }) => l.sensorId === sensor.id));
    }
  });

  it("#21 CA-6: un nodo sin sensores responde 200 con cero lecturas", async () => {
    const res = await simular(sinSensores);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ lecturas: [] });
  });

  it.each([
    ["sin nodoId", { cuerpo: {} }],
    ["con un nodoId que no es UUID", { cuerpo: { nodoId: "todos" } }],
    ["con un cuerpo que no es JSON", { crudo: "nodo" }],
  ])("#21 CA-3: %s responde 400 con el detalle", async (_caso, cuerpo) => {
    const res = await POST(await peticion("POST", RUTA, { rol: "administrador", ...cuerpo }), undefined);
    expect(res.status).toBe(400);
    expect((await res.json()).detalles.length).toBeGreaterThan(0);
  });

  it("#21 CA-4: un nodo inexistente responde 404", async () => {
    const res = await simular(randomUUID());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Nodo no encontrado" });
  });

  it("#21 CA-5: el técnico recibe 403 y no se registra ninguna lectura", async () => {
    const antes = await lecturasDe(conSensores);
    const res = await POST(await peticion("POST", RUTA, { rol: "tecnico", cuerpo: { nodoId: conSensores } }), undefined);
    expect(res.status).toBe(403);
    expect(await lecturasDe(conSensores)).toBe(antes);
  });

  it("#21 CA-5, CA-6: el técnico sí consulta la última lectura de cada sensor", async () => {
    await simular(conSensores);
    const sensores = await sensoresDe(conSensores, "tecnico");
    expect(sensores.every((s: { ultimaLectura: unknown }) => s.ultimaLectura !== null)).toBe(true);
  });

  it("#21 CA-5: sin sesión responde 401", async () => {
    const res = await POST(await peticion("POST", RUTA, { cuerpo: { nodoId: conSensores } }), undefined);
    expect(res.status).toBe(401);
  });
});
