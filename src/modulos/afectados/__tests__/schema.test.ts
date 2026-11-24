import { describe, expect, it } from "vitest";
import { afectadosConsultaSchema } from "../schema";

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
