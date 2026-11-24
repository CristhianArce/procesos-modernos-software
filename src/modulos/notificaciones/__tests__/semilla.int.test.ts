import { readdirSync, readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// npm run seed aplica los archivos en orden alfabético: notificaciones.sql va después de auth.sql.
const archivos = readdirSync("db/seed").filter((f) => f.endsWith(".sql")).sort();
const aplicar = async () => {
  for (const f of archivos) await db().query(readFileSync(`db/seed/${f}`, "utf8"));
};
const DE_LA_SEMILLA = "00000000-0000-4000-8000-0000000024%";
const filas = async () =>
  (
    await db().query(
      `SELECT n.id, n.sensor_nombre, n.magnitud, n.valor, n.leida, u.nombre_usuario
       FROM notificaciones n JOIN usuarios u ON u.id = n.usuario_id
       WHERE n.id::text LIKE $1 ORDER BY n.alerta_creada_en DESC, n.id DESC`,
      [DE_LA_SEMILLA],
    )
  ).rows;

afterAll(() => db().end());

describe("semilla de notificaciones", () => {
  it("#24 CA-1: la semilla deja leídas y no leídas para tecnico en orden", async () => {
    await aplicar();
    const rows = await filas();
    expect(rows.map((r) => r.id.slice(-2))).toEqual(["04", "03", "02", "01"]);
    expect(rows.every((r) => r.nombre_usuario === "tecnico")).toBe(true);
    expect(rows.map((r) => [r.sensor_nombre, r.magnitud, r.valor])).toEqual([
      ["Sensor de tensión S1", "voltaje", 128.9],
      ["Sensor de potencia S3", "potencia", 2150],
      ["Sensor de corriente S2", "corriente", 17.2],
      ["Sensor de tensión S1", "voltaje", 131.4],
    ]);
    expect(rows.filter((r) => r.leida).map((r) => r.id.slice(-2))).toEqual(["01"]);
  });

  it("#24 CA-1: aplicar la semilla dos veces no duplica nada", async () => {
    await aplicar();
    const antes = await filas();
    await aplicar();
    expect(await filas()).toEqual(antes);
    expect(antes).toHaveLength(4);
  });

  it("#24 CA-1: se aplica después de la semilla de usuarios", () => {
    expect(archivos.indexOf("notificaciones.sql")).toBeGreaterThan(archivos.indexOf("auth.sql"));
  });
});
