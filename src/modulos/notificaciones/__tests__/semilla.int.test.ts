import { readdirSync, readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// npm run seed aplica los archivos en orden alfabético: notificaciones.sql va después de auth.sql.
const archivos = readdirSync("db/seed").filter((f) => f.endsWith(".sql")).sort();
const aplicar = async () => {
  for (const f of archivos) await db().query(readFileSync(`db/seed/${f}`, "utf8"));
};
const IDS = ["01", "02", "03", "04"].map((n) => `00000000-0000-4000-8000-0000000024${n}`);

afterAll(() => db().end());

describe("semilla de notificaciones", () => {
  it("#24 CA-1: la semilla deja leídas y no leídas para tecnico en orden", async () => {
    await aplicar();
    const { rows } = await db().query(
      `SELECT n.id, n.sensor_nombre, n.magnitud, n.valor, n.leida
       FROM notificaciones n JOIN usuarios u ON u.id = n.usuario_id
       WHERE u.nombre_usuario = 'tecnico' AND n.id = ANY($1::uuid[])
       ORDER BY n.alerta_creada_en DESC, n.id DESC`,
      [IDS],
    );
    expect(rows.map((f) => f.id)).toEqual([IDS[3], IDS[2], IDS[1], IDS[0]]);
    expect(rows.map((f) => f.leida)).toEqual([false, false, false, true]);
    expect(rows[0]).toMatchObject({ sensor_nombre: "Sensor de tensión S1", magnitud: "voltaje", valor: 128.9 });
    expect(rows[1]).toMatchObject({ sensor_nombre: "Sensor de potencia S3", magnitud: "potencia", valor: 2150 });
    expect(rows[2]).toMatchObject({ sensor_nombre: "Sensor de corriente S2", magnitud: "corriente", valor: 17.2 });
    expect(rows[3]).toMatchObject({ sensor_nombre: "Sensor de tensión S1", magnitud: "voltaje", valor: 131.4 });
  });

  it("#24 CA-1: aplicar la semilla dos veces no duplica las notificaciones", async () => {
    await aplicar();
    const contar = async () =>
      (await db().query("SELECT count(*)::int AS n FROM notificaciones WHERE id = ANY($1::uuid[])", [IDS])).rows[0].n;
    const antes = await contar();
    await aplicar();
    expect(await contar()).toBe(antes);
    expect(antes).toBe(4);
  });
});
