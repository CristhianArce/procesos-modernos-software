import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { conId, peticion } from "@/test/api";
import { GET as GET_NODO } from "../estado/nodos/[id]/route";
import { GET } from "../estado/route";

const prefijo = `int-api-estado-${randomUUID().slice(0, 8)}`;
let nodoId: string;
let sensorId: string;

beforeAll(async () => {
  nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  sensorId = (await db().query("INSERT INTO sensores (nodo_id, nombre, umbral_voltaje) VALUES ($1, 'sensor', 125) RETURNING id", [nodoId])).rows[0].id;
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
       ($1, 120, 1, 120, now() - interval '10 seconds'), ($1, 130, 2, 260, now() - interval '5 seconds')`,
    [sensorId],
  );
  await db().query("INSERT INTO alertas (sensor_id, magnitud, valor, umbral) VALUES ($1, 'voltaje', 130, 125)", [sensorId]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("API del estado en vivo", () => {
  it("ui-scada: sin sesión, la instantánea y el detalle responden 401", async () => {
    expect((await GET(await peticion("GET", "/api/estado"), undefined)).status).toBe(401);
    expect((await GET_NODO(await peticion("GET", `/api/estado/nodos/${nodoId}`), conId(nodoId))).status).toBe(401);
  });

  it("ui-scada: el técnico recibe una instantánea compacta con nodos, indicadores y alertas recientes, sin caché", async () => {
    const res = await GET(await peticion("GET", "/api/estado", { rol: "tecnico" }), undefined);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const e = await res.json();
    expect(e.generadaEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e.indicadores).toHaveProperty("potenciaTotal");
    expect(e.nodos).toContainEqual({
      id: nodoId,
      conexion: "conectado",
      nivel: "critico",
      voltaje: 130,
      corriente: 2,
      potencia: 260,
      tomadaEn: expect.any(String),
      alertasActivas: 1,
    });
    expect(e.alertas).toContainEqual(expect.objectContaining({ nodoId, nodoNombre: prefijo, sensorNombre: "sensor", valor: 130, umbral: 125 }));
  });

  it("ui-scada: el detalle de un nodo trae sus sensores con umbrales y lecturas recientes, y sus alertas", async () => {
    const res = await GET_NODO(await peticion("GET", `/api/estado/nodos/${nodoId}`, { rol: "tecnico" }), conId(nodoId));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.id).toBe(nodoId);
    expect(d.sensores).toEqual([
      {
        id: sensorId,
        nombre: "sensor",
        umbralVoltaje: 125,
        umbralCorriente: null,
        umbralPotencia: null,
        lecturas: [
          { voltaje: 120, corriente: 1, potencia: 120, tomadaEn: expect.any(String) },
          { voltaje: 130, corriente: 2, potencia: 260, tomadaEn: expect.any(String) },
        ],
      },
    ]);
    expect(d.alertas).toEqual([expect.objectContaining({ nodoId, sensorNombre: "sensor", valor: 130 })]);
  });

  it("ui-scada: el detalle de un nodo que no existe o con id inválido responde 404", async () => {
    const id = randomUUID();
    expect((await GET_NODO(await peticion("GET", `/api/estado/nodos/${id}`, { rol: "tecnico" }), conId(id))).status).toBe(404);
    expect((await GET_NODO(await peticion("GET", "/api/estado/nodos/x", { rol: "tecnico" }), conId("x"))).status).toBe(404);
  });
});
