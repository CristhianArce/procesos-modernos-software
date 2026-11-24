import { describe, expect, it } from "vitest";
import { afectadoCrearSchema } from "../schema";

const nodoId = "00000000-0000-4000-8000-000000000001";

describe("esquema de afectados", () => {
  it("#54 CA-2: acepta un alias válido y un nodoId UUID", () => {
    expect(afectadoCrearSchema.parse({ nodoId, alias: "Usuario demo 01" })).toEqual({ nodoId, alias: "Usuario demo 01" });
    expect(afectadoCrearSchema.parse({ nodoId, alias: "x".repeat(100) }).alias).toHaveLength(100);
  });

  it("#54 CA-2: recorta los espacios del alias", () => {
    expect(afectadoCrearSchema.parse({ nodoId, alias: "  Usuario demo 01  " })).toEqual({ nodoId, alias: "Usuario demo 01" });
  });

  it.each([
    ["alias vacío", { nodoId, alias: "" }],
    ["alias de solo espacios", { nodoId, alias: "   " }],
    ["alias de 101 caracteres", { nodoId, alias: "x".repeat(101) }],
    ["alias ausente", { nodoId }],
    ["alias que no es texto", { nodoId, alias: 5 }],
    ["nodoId ausente", { alias: "Usuario demo 01" }],
    ["nodoId que no es UUID", { nodoId: "abc", alias: "Usuario demo 01" }],
    ["cuerpo que no es un objeto", undefined],
  ])("#54 CA-2: rechaza: %s", (_caso, entrada) => {
    expect(afectadoCrearSchema.safeParse(entrada).success).toBe(false);
  });
});
