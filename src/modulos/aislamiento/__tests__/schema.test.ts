import { describe, expect, it } from "vitest";
import { cambiarEstadoSchema } from "../schema";

describe("esquema del cambio de estado", () => {
  it.each(["conectado", "desconectado"])("#23 CA-1: acepta el estado %s", (estado) => {
    expect(cambiarEstadoSchema.parse({ estado })).toEqual({ estado });
  });

  it.each([
    ["otro valor", { estado: "apagado" }],
    ["un valor vacío", { estado: "" }],
    ["sin estado", {}],
    ["un número", { estado: 1 }],
    ["un cuerpo que no es un objeto", undefined],
  ])("#23 CA-1: rechaza %s", (_caso, cuerpo) => {
    expect(cambiarEstadoSchema.safeParse(cuerpo).success).toBe(false);
  });
});
