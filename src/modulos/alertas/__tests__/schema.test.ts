import { describe, expect, it } from "vitest";
import { alertasConsultaSchema } from "../schema";

const sensorId = "00000000-0000-4000-8000-000000000101";

describe("consulta de alertas", () => {
  it("#22 CA-7: sin parámetros toma las 20 alertas más recientes", () => {
    expect(alertasConsultaSchema.parse({})).toEqual({ limite: 20 });
  });

  it("#22 CA-7: acepta un sensorId UUID y un límite de texto entre 1 y 100", () => {
    expect(alertasConsultaSchema.parse({ sensorId, limite: "100" })).toEqual({ sensorId, limite: 100 });
  });

  it.each([
    ["sensorId que no es UUID", { sensorId: "abc" }],
    ["límite 0", { limite: "0" }],
    ["límite 101", { limite: "101" }],
    ["límite decimal", { limite: "1.5" }],
    ["límite no numérico", { limite: "x" }],
  ])("#22 CA-7: rechaza %s", (_caso, entrada) => {
    expect(alertasConsultaSchema.safeParse(entrada).success).toBe(false);
  });
});
