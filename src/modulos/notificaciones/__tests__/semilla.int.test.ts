import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// npm run seed aplica los archivos en orden alfabético: auth.sql (usuarios) va antes que notificaciones.sql.
const auth = readFileSync("db/seed/auth.sql", "utf8");
const semilla = readFileSync("db/seed/notificaciones.sql", "utf8");

const delTecnico = () =>
  db().query(
    `SELECT n.id, n.leida FROM notificaciones n JOIN usuarios u ON u.id = n.usuario_id
     WHERE u.nombre_usuario = 'tecnico' ORDER BY n.id`,
  );

beforeAll(async () => {
  await db().query(auth);
  await db().query(semilla);
});

afterAll(async () => {
  await db().end();
});

describe("semilla de notificaciones", () => {
  it("#24 CA-1: la semilla deja 4 notificaciones del técnico, 2 sin leer", async () => {
    const { rows } = await delTecnico();
    expect(rows).toHaveLength(4);
    expect(rows.filter((f) => !f.leida)).toHaveLength(2);
  });

  it("#24 CA-1: aplicar la semilla dos veces no duplica", async () => {
    const antes = (await delTecnico()).rows;
    await db().query(semilla);
    expect((await delTecnico()).rows).toEqual(antes);
  });
});
