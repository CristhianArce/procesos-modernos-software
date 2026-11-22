import { describe, expect, it } from "vitest";
import { loginSchema } from "../schema";

describe("loginSchema", () => {
  it("#20 CA-3: acepta usuario y contraseña, y recorta los espacios del usuario", () => {
    expect(loginSchema.parse({ usuario: "  admin ", contrasena: "clave" })).toEqual({ usuario: "admin", contrasena: "clave" });
  });

  it.each([
    ["sin usuario", { contrasena: "clave" }],
    ["sin contraseña", { usuario: "admin" }],
    ["usuario vacío", { usuario: "   ", contrasena: "clave" }],
    ["contraseña vacía", { usuario: "admin", contrasena: "" }],
    ["usuario de más de 64 caracteres", { usuario: "u".repeat(65), contrasena: "clave" }],
    ["contraseña de más de 128 caracteres", { usuario: "admin", contrasena: "c".repeat(129) }],
    ["usuario que no es texto", { usuario: 7, contrasena: "clave" }],
    ["cuerpo ausente", undefined],
  ])("#20 CA-3: rechaza %s", (_caso, cuerpo) => {
    expect(loginSchema.safeParse(cuerpo).success).toBe(false);
  });
});
