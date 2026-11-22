import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { buscarPorNombre } from "../repo";

const nombre = `prueba-repo-${randomUUID().slice(0, 8)}`;

beforeAll(async () => {
  await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico')", [nombre]);
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario = $1", [nombre]);
  await db().end();
});

describe("repo de usuarios", () => {
  it("#20 CA-1: buscarPorNombre devuelve id, nombre, hash y rol del usuario", async () => {
    const usuario = await buscarPorNombre(nombre);
    expect(usuario).toMatchObject({ nombreUsuario: nombre, contrasenaHash: "hash-de-prueba", rol: "tecnico" });
    expect(usuario?.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("#20 CA-2: buscarPorNombre devuelve null si el usuario no existe", async () => {
    expect(await buscarPorNombre(`${nombre}-no-existe`)).toBeNull();
  });
});
