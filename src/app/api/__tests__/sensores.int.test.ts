import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { conId, peticion } from "@/test/api";
import { DELETE, GET as GET_UNO, PATCH } from "../sensores/[id]/route";
import { GET, POST } from "../sensores/route";

const prefijo = `int-api-sensores-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/sensores";
let nodoId: string;

const crear = async (nombre = "S") =>
  (await POST(await peticion("POST", RUTA, { rol: "administrador", cuerpo: { nodoId, nombre, umbralVoltaje: 125 } }), undefined)).json();
const cuantos = async () => (await db().query("SELECT count(*)::int AS n FROM sensores WHERE nodo_id = $1", [nodoId])).rows[0].n as number;

beforeAll(async () => {
  nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("API de sensores", () => {
  it("#21 CA-2: el administrador agrega un sensor con 201, queda asociado al nodo y aparece entre sus sensores", async () => {
    const cuerpo = { nodoId, nombre: "Transformador", umbralVoltaje: 125, umbralCorriente: 15 };
    const res = await POST(await peticion("POST", RUTA, { rol: "administrador", cuerpo }), undefined);
    expect(res.status).toBe(201);
    const sensor = await res.json();
    expect(sensor).toMatchObject({ ...cuerpo, umbralPotencia: null, ultimaLectura: null });

    const lista = await GET(await peticion("GET", `${RUTA}?nodoId=${nodoId}`, { rol: "administrador" }), undefined);
    expect(lista.status).toBe(200);
    expect(await lista.json()).toContainEqual(sensor);
  });

  it.each([
    ["un umbral negativo", { cuerpo: { nombre: "S", umbralVoltaje: -1 } }],
    ["un umbral en cero", { cuerpo: { nombre: "S", umbralCorriente: 0 } }],
    ["un umbral que no es un número", { cuerpo: { nombre: "S", umbralPotencia: "alto" } }],
    ["un nombre vacío", { cuerpo: { nombre: "" } }],
    ["un cuerpo que no es JSON", { crudo: "{" }],
  ])("#21 CA-3: crear con %s responde 400 con el detalle y no guarda nada", async (_caso, { cuerpo, crudo }: { cuerpo?: object; crudo?: string }) => {
    const antes = await cuantos();
    const res = await POST(await peticion("POST", RUTA, { rol: "administrador", crudo, cuerpo: cuerpo && { nodoId, ...cuerpo } }), undefined);
    expect(res.status).toBe(400);
    expect((await res.json()).detalles.length).toBeGreaterThan(0);
    expect(await cuantos()).toBe(antes);
  });

  it("#21 CA-3: editar con datos inválidos responde 400 y el sensor conserva sus datos", async () => {
    const sensor = await crear();
    for (const cuerpo of [{}, { umbralVoltaje: 0 }, { nombre: " " }, { nodoId: randomUUID() }]) {
      const res = await PATCH(await peticion("PATCH", `${RUTA}/${sensor.id}`, { rol: "administrador", cuerpo }), conId(sensor.id));
      expect(res.status).toBe(400);
    }
    expect(await (await GET_UNO(await peticion("GET", `${RUTA}/${sensor.id}`, { rol: "administrador" }), conId(sensor.id))).json()).toEqual(sensor);
  });

  it("#21 CA-3: editar con datos válidos responde 200 y permite quitar un umbral", async () => {
    const sensor = await crear();
    const res = await PATCH(
      await peticion("PATCH", `${RUTA}/${sensor.id}`, { rol: "administrador", cuerpo: { nombre: "Editado", umbralVoltaje: null, umbralPotencia: 1800 } }),
      conId(sensor.id),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...sensor, nombre: "Editado", umbralVoltaje: null, umbralPotencia: 1800 });
  });

  it("#21 CA-3: listar sin nodoId responde 400", async () => {
    const res = await GET(await peticion("GET", RUTA, { rol: "administrador" }), undefined);
    expect(res.status).toBe(400);
    expect((await res.json()).detalles[0].campo).toBe("nodoId");
  });

  it.each([
    ["inexistente", randomUUID()],
    ["mal formado", "no-es-un-uuid"],
  ])("#21 CA-4: consultar, editar y eliminar un sensor %s responde 404", async (_caso, id) => {
    const ruta = `${RUTA}/${id}`;
    const respuestas = [
      await GET_UNO(await peticion("GET", ruta, { rol: "administrador" }), conId(id)),
      await PATCH(await peticion("PATCH", ruta, { rol: "administrador", cuerpo: { nombre: "x" } }), conId(id)),
      await DELETE(await peticion("DELETE", ruta, { rol: "administrador" }), conId(id)),
    ];
    for (const res of respuestas) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Sensor no encontrado" });
    }
  });

  it("#21 CA-4: agregar un sensor o listar los de un nodo inexistente responde 404 y no crea nada", async () => {
    const inexistente = randomUUID();
    const crearRes = await POST(await peticion("POST", RUTA, { rol: "administrador", cuerpo: { nodoId: inexistente, nombre: "S" } }), undefined);
    expect(crearRes.status).toBe(404);
    expect(await crearRes.json()).toEqual({ error: "Nodo no encontrado" });
    expect((await db().query("SELECT 1 FROM sensores WHERE nodo_id = $1", [inexistente])).rowCount).toBe(0);
    expect((await GET(await peticion("GET", `${RUTA}?nodoId=${inexistente}`, { rol: "administrador" }), undefined)).status).toBe(404);
  });

  it("#21 CA-4: eliminar un sensor responde 204 y después ya no existe", async () => {
    const sensor = await crear();
    expect((await DELETE(await peticion("DELETE", `${RUTA}/${sensor.id}`, { rol: "administrador" }), conId(sensor.id))).status).toBe(204);
    expect((await GET_UNO(await peticion("GET", `${RUTA}/${sensor.id}`, { rol: "administrador" }), conId(sensor.id))).status).toBe(404);
  });

  it("#21 CA-5: el técnico recibe 403 al agregar, editar y eliminar, y nada cambia", async () => {
    const sensor = await crear();
    const antes = await cuantos();
    const ruta = `${RUTA}/${sensor.id}`;
    const respuestas = [
      await POST(await peticion("POST", RUTA, { rol: "tecnico", cuerpo: { nodoId, nombre: "S" } }), undefined),
      await PATCH(await peticion("PATCH", ruta, { rol: "tecnico", cuerpo: { nombre: "x" } }), conId(sensor.id)),
      await DELETE(await peticion("DELETE", ruta, { rol: "tecnico" }), conId(sensor.id)),
    ];
    for (const res of respuestas) expect(res.status).toBe(403);
    expect(await cuantos()).toBe(antes);
  });

  it("#21 CA-5: el técnico sí consulta los sensores de un nodo y un sensor", async () => {
    const sensor = await crear();
    const lista = await GET(await peticion("GET", `${RUTA}?nodoId=${nodoId}`, { rol: "tecnico" }), undefined);
    expect(lista.status).toBe(200);
    expect(await lista.json()).toContainEqual(sensor);
    expect((await GET_UNO(await peticion("GET", `${RUTA}/${sensor.id}`, { rol: "tecnico" }), conId(sensor.id))).status).toBe(200);
  });

  it("#21 CA-5: sin sesión toda ruta de sensores responde 401", async () => {
    const id = randomUUID();
    const respuestas = [
      await GET(await peticion("GET", `${RUTA}?nodoId=${nodoId}`), undefined),
      await POST(await peticion("POST", RUTA, { cuerpo: { nodoId, nombre: "S" } }), undefined),
      await GET_UNO(await peticion("GET", `${RUTA}/${id}`), conId(id)),
      await PATCH(await peticion("PATCH", `${RUTA}/${id}`, { cuerpo: { nombre: "x" } }), conId(id)),
      await DELETE(await peticion("DELETE", `${RUTA}/${id}`), conId(id)),
    ];
    for (const res of respuestas) expect(res.status).toBe(401);
  });
});
