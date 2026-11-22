import { describe, expect, it } from "vitest";
import { simularSchema } from "../schema";

describe("esquema del simulador", () => {
  it("#21 CA-6: acepta el identificador del nodo", () => {
    const nodoId = "00000000-0000-4000-8000-000000000001";
    expect(simularSchema.parse({ nodoId })).toEqual({ nodoId });
  });

  it.each([
    ["sin nodoId", {}],
    ["nodoId que no es UUID", { nodoId: "todos" }],
    ["cuerpo que no es un objeto", undefined],
  ])("#21 CA-3: rechaza %s", (_caso, entrada) => {
    expect(simularSchema.safeParse(entrada).success).toBe(false);
  });
});
