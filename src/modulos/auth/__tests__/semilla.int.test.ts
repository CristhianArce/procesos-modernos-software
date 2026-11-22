import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { crearLimitador } from "../limitador";
import { iniciarSesion } from "../service";

// Cuentas de demostración documentadas en el README (sección «Cuentas de demostración»).
const cuentas = [
  { usuario: "admin", contrasena: "Demo-Admin-2026", rol: "administrador" },
  { usuario: "tecnico", contrasena: "Demo-Tecnico-2026", rol: "tecnico" },
] as const;

const semilla = readFileSync("db/seed/auth.sql", "utf8");

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(32);
});

afterAll(() => db().end());

describe("semilla de autenticación", () => {
  it("#20 CA-1: se puede aplicar dos veces sin duplicar las cuentas", async () => {
    await db().query(semilla);
    await db().query(semilla);
    const { rows } = await db().query("SELECT nombre_usuario, count(*)::int AS filas FROM usuarios WHERE nombre_usuario = ANY($1) GROUP BY 1", [
      cuentas.map((c) => c.usuario),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.filas === 1)).toBe(true);
  });

  it.each(cuentas)("#20 CA-1: la cuenta $usuario del README inicia sesión con el rol $rol", async ({ usuario, contrasena, rol }) => {
    await db().query(semilla);
    const resultado = await iniciarSesion({ usuario, contrasena, ip: "127.0.0.1" }, crearLimitador());
    expect(resultado).toMatchObject({ usuario, rol });
  });

  it("#20 CA-1: el README documenta las contraseñas de demostración", () => {
    const readme = readFileSync("README.md", "utf8");
    for (const { usuario, contrasena } of cuentas) {
      expect(readme).toContain(`\`${usuario}\``);
      expect(readme).toContain(`\`${contrasena}\``);
    }
  });

  it("#20 CA-2: la semilla guarda solo el hash, nunca la contraseña", () => {
    for (const { contrasena } of cuentas) expect(semilla).not.toContain(contrasena);
  });
});
