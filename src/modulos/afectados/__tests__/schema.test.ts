import { describe, expect, it } from "vitest";
import { afectadoCrearSchema, afectadosConsultaSchema } from "../schema";

const nodoId = "00000000-0000-4000-8000-000000000001";

describe("esquema de afectados", () => {
  it("#25 CA-3: acepta un UUID", () => {
    expect(afectadosConsultaSchema.parse({ nodoId })).toEqual({ nodoId });
  });

  it.each([
    ["nodoId que no es UUID", { nodoId: "abc" }],
    ["nodoId vacío", { nodoId: "" }],
    ["sin nodoId", {}],
  ])("#25 CA-3: rechaza %s", (_caso, entrada) => {
    expect(afectadosConsultaSchema.safeParse(entrada).success).toBe(false);
  });
});

describe("esquema de alta de afectado", () => {
  it.each([
    ["alias vacío", ""],
    ["alias solo con espacios", "   "],
    ["alias de 81 caracteres", "a".repeat(81)],
  ])("#54 CA-2: rechaza %s", (_caso, alias) => {
    expect(afectadoCrearSchema.safeParse({ nodoId, alias }).success).toBe(false);
  });

  it.each([
    ["1 carácter", "a"],
    ["80 caracteres", "a".repeat(80)],
  ])("#54 CA-2: acepta un alias de %s", (_caso, alias) => {
    expect(afectadoCrearSchema.parse({ nodoId, alias })).toEqual({ nodoId, alias });
  });

  it("#54 CA-2: recorta los espacios de los extremos del alias", () => {
    expect(afectadoCrearSchema.parse({ nodoId, alias: "  Usuario demo  " })).toEqual({ nodoId, alias: "Usuario demo" });
  });

  it.each([
    ["nodoId que no es UUID", { nodoId: "abc", alias: "Ana" }],
    ["sin nodoId", { alias: "Ana" }],
    ["sin alias", { nodoId }],
    ["alias que no es texto", { nodoId, alias: 5 }],
  ])("#54 CA-2: rechaza %s", (_caso, entrada) => {
    expect(afectadoCrearSchema.safeParse(entrada).success).toBe(false);
  });
});
