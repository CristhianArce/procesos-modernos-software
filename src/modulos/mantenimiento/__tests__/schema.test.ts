import { describe, expect, it } from "vitest";
import { asignarTecnicoSchema } from "../schema";

const uuid = "00000000-0000-4000-8000-000000000abc";

describe("esquema de asignar técnico", () => {
  it("#27 CA-1: acepta un tecnicoId UUID", () => {
    expect(asignarTecnicoSchema.safeParse({ tecnicoId: uuid }).success).toBe(true);
  });

  it.each([
    ["sin tecnicoId", {}],
    ["un texto que no es UUID", { tecnicoId: "abc" }],
    ["un número", { tecnicoId: 5 }],
    ["null", { tecnicoId: null }],
  ])("#27 CA-2: rechaza %s", (_nombre, cuerpo) => {
    expect(asignarTecnicoSchema.safeParse(cuerpo).success).toBe(false);
  });
});
