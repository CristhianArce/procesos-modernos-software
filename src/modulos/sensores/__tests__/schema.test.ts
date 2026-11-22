import { describe, expect, it } from "vitest";
import { sensorCrearSchema, sensorEditarSchema, sensoresConsultaSchema } from "../schema";

const nodoId = "00000000-0000-4000-8000-000000000001";

describe("esquemas de sensores", () => {
  it("#21 CA-2: acepta nodo, nombre y umbrales opcionales", () => {
    expect(sensorCrearSchema.parse({ nodoId, nombre: " S1 ", umbralVoltaje: 125 })).toEqual({ nodoId, nombre: "S1", umbralVoltaje: 125 });
    expect(sensorCrearSchema.parse({ nodoId, nombre: "S1", umbralPotencia: null })).toEqual({ nodoId, nombre: "S1", umbralPotencia: null });
  });

  it.each([
    ["nodoId que no es UUID", { nodoId: "abc", nombre: "S1" }],
    ["sin nodoId", { nombre: "S1" }],
    ["nombre vacío", { nodoId, nombre: "" }],
    ["nombre de más de 80 caracteres", { nodoId, nombre: "x".repeat(81) }],
    ["umbral negativo", { nodoId, nombre: "S1", umbralVoltaje: -1 }],
    ["umbral en cero", { nodoId, nombre: "S1", umbralCorriente: 0 }],
    ["umbral que no es un número", { nodoId, nombre: "S1", umbralPotencia: "alto" }],
    ["cuerpo que no es un objeto", undefined],
  ])("#21 CA-3: rechaza al crear: %s", (_caso, entrada) => {
    expect(sensorCrearSchema.safeParse(entrada).success).toBe(false);
  });

  it("#21 CA-3: la edición acepta un subconjunto y permite quitar un umbral con null", () => {
    expect(sensorEditarSchema.parse({ umbralVoltaje: null })).toEqual({ umbralVoltaje: null });
    expect(sensorEditarSchema.parse({ nombre: "S2", umbralCorriente: 10 })).toEqual({ nombre: "S2", umbralCorriente: 10 });
  });

  it("#21 CA-3: la edición rechaza un cuerpo sin campos y un umbral inválido", () => {
    expect(sensorEditarSchema.safeParse({}).success).toBe(false);
    expect(sensorEditarSchema.safeParse({ umbralVoltaje: 0 }).success).toBe(false);
  });

  it("#21 CA-3: la edición descarta nodoId, que no es editable", () => {
    expect(sensorEditarSchema.parse({ nombre: "S2", nodoId })).toEqual({ nombre: "S2" });
    expect(sensorEditarSchema.safeParse({ nodoId }).success).toBe(false);
  });

  it("#21 CA-3: la consulta exige un nodoId con forma de UUID", () => {
    expect(sensoresConsultaSchema.parse({ nodoId })).toEqual({ nodoId });
    expect(sensoresConsultaSchema.safeParse({}).success).toBe(false);
    expect(sensoresConsultaSchema.safeParse({ nodoId: "abc" }).success).toBe(false);
  });
});
