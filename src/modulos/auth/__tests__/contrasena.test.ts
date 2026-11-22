import { describe, expect, it } from "vitest";
import { hashearContrasena, verificarContrasena } from "../contrasena";

describe("contrasena", () => {
  it("#20 CA-2: el hash guardado nunca contiene la contraseña en claro", async () => {
    const hash = await hashearContrasena("Clave-Secreta-1");
    expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(hash).not.toContain("Clave-Secreta-1");
  });

  it("#20 CA-2: dos hashes de la misma contraseña difieren por la sal", async () => {
    expect(await hashearContrasena("misma")).not.toBe(await hashearContrasena("misma"));
  });

  it("#20 CA-1: verifica la contraseña correcta", async () => {
    expect(await verificarContrasena("Clave-Secreta-1", await hashearContrasena("Clave-Secreta-1"))).toBe(true);
  });

  it("#20 CA-2: rechaza una contraseña incorrecta", async () => {
    expect(await verificarContrasena("otra", await hashearContrasena("Clave-Secreta-1"))).toBe(false);
  });

  it.each(["", "texto-libre", "scrypt$solo-sal", "bcrypt$aa$bb", "scrypt$zz$zz", "scrypt$aa$"])(
    "#20 CA-2: un hash mal formado (%j) no verifica y no lanza",
    async (hash) => {
      expect(await verificarContrasena("lo-que-sea", hash)).toBe(false);
    },
  );
});
