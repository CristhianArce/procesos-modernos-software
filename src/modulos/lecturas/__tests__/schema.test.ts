import { describe, expect, it } from "vitest";
import { lecturasConsultaSchema } from "../schema";

const sensorId = "00000000-0000-4000-8000-000000000101";

describe("consulta de lecturas", () => {
  it("#22 CA-7: sin parámetros toma 50 lecturas de todos los sensores", () => {
    expect(lecturasConsultaSchema.parse({})).toEqual({ limite: 50 });
  });

  it("#22 CA-7: acepta un sensorId UUID y un límite de texto entre 1 y 100", () => {
    expect(lecturasConsultaSchema.parse({ sensorId, limite: "1" })).toEqual({ sensorId, limite: 1 });
    expect(lecturasConsultaSchema.parse({ limite: "100" }).limite).toBe(100);
  });

  it.each([
    ["sensorId que no es UUID", { sensorId: "abc" }],
    ["sensorId vacío", { sensorId: "" }],
    ["límite 0", { limite: "0" }],
    ["límite 101", { limite: "101" }],
    ["límite decimal", { limite: "2.5" }],
    ["límite no numérico", { limite: "muchas" }],
  ])("#22 CA-7: rechaza %s", (_caso, entrada) => {
    expect(lecturasConsultaSchema.safeParse(entrada).success).toBe(false);
  });
});
