import { describe, expect, it } from "vitest";
import { afectadosConsultaSchema } from "../schema";

const id = "00000000-0000-4000-8000-000000000002";

describe("esquema de la consulta de afectados", () => {
  it("#25 CA-1: acepta un UUID como nodoId", () => {
    expect(afectadosConsultaSchema.parse({ nodoId: id })).toEqual({ nodoId: id });
  });

  it.each([
    ["nodoId ausente", {}],
    ["nodoId vacío", { nodoId: "" }],
    ["nodoId que no es UUID", { nodoId: "abc" }],
    ["nodoId numérico", { nodoId: 1 }],
  ])("#25 CA-3: rechaza %s", (_caso, consulta) => {
    expect(afectadosConsultaSchema.safeParse(consulta).success).toBe(false);
  });
});
