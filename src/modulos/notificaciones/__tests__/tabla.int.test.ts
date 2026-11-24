import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `int-tabla-notif-${randomUUID().slice(0, 8)}`;
let usuarioId: string;

const insertar = (sensorNombre: string, magnitud = "voltaje") =>
  db().query(
    "INSERT INTO notificaciones (id, usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en) VALUES ($1, $2, $3, $4, 130, now()) RETURNING *",
    [randomUUID(), usuarioId, sensorNombre, magnitud],
  );

beforeAll(async () => {
  usuarioId = (await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [prefijo])).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario = $1", [prefijo]);
  await db().end();
});

describe("tabla notificaciones", () => {
  it("#24 CA-1: la tabla guarda sensor_nombre sin clave foránea ni umbral", async () => {
    const { rows: columnas } = await db().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notificaciones'");
    const nombres = columnas.map((c) => c.column_name);
    expect(nombres).toEqual(expect.arrayContaining(["sensor_nombre", "magnitud", "valor", "alerta_creada_en", "leida"]));
    expect(nombres).not.toContain("umbral");
    expect(nombres).not.toContain("nodo_id");
    expect(nombres).not.toContain("sensor_id");

    const { rows: claves } = await db().query(
      `SELECT confrelid::regclass::text AS destino FROM pg_constraint WHERE conrelid = 'notificaciones'::regclass AND contype = 'f'`,
    );
    expect(claves.map((c) => c.destino)).toEqual(["usuarios"]);

    const { rows } = await insertar("Sensor propio");
    expect(rows[0]).toMatchObject({ usuario_id: usuarioId, sensor_nombre: "Sensor propio", magnitud: "voltaje", valor: 130, leida: false });
  });

  it("#24 CA-1: rechaza una magnitud desconocida", async () => {
    await expect(insertar("Sensor propio", "frecuencia")).rejects.toThrow();
  });

  it("#24 CA-1: la notificación sobrevive al borrado del sensor", async () => {
    const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
    await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, $2)", [nodoId, `${prefijo}-sensor`]);
    const { rows } = await insertar(`${prefijo}-sensor`);

    await db().query("DELETE FROM nodos WHERE id = $1", [nodoId]);

    const { rows: quedan } = await db().query("SELECT sensor_nombre FROM notificaciones WHERE id = $1", [rows[0].id]);
    expect(quedan).toEqual([{ sensor_nombre: `${prefijo}-sensor` }]);
  });
});
