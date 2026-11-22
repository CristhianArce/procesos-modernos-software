import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `prueba-usuarios-${randomUUID().slice(0, 8)}`;

const insertar = (nombre: string, rol: string) =>
  db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', $2)", [nombre, rol]);

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("tabla usuarios", () => {
  it("#20 CA-1: guarda un usuario con id y fecha de creación generados", async () => {
    await insertar(`${prefijo}-ok`, "tecnico");
    const { rows } = await db().query("SELECT id, creado_en FROM usuarios WHERE nombre_usuario = $1", [`${prefijo}-ok`]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows[0].creado_en).toBeInstanceOf(Date);
  });

  it("#20 CA-2: rechaza un nombre de usuario repetido", async () => {
    await insertar(`${prefijo}-repetido`, "administrador");
    await expect(insertar(`${prefijo}-repetido`, "tecnico")).rejects.toMatchObject({ code: "23505" });
  });

  it("#20 CA-1: rechaza un rol distinto de administrador y tecnico", async () => {
    await expect(insertar(`${prefijo}-rol`, "invitado")).rejects.toMatchObject({ code: "23514" });
  });
});
