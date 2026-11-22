import { describe, expect, it } from "vitest";
import { esUuid, nodoCrearSchema, nodoEditarSchema } from "../schema";

describe("esquemas de nodos", () => {
  it("#21 CA-1: acepta un nombre con ubicación y recorta los espacios", () => {
    expect(nodoCrearSchema.parse({ nombre: "  Nodo A ", ubicacion: " Bello " })).toEqual({ nombre: "Nodo A", ubicacion: "Bello" });
  });

  it("#21 CA-1: la ubicación es opcional y una vacía queda en null", () => {
    expect(nodoCrearSchema.parse({ nombre: "Nodo A" })).toEqual({ nombre: "Nodo A" });
    expect(nodoCrearSchema.parse({ nombre: "Nodo A", ubicacion: "  " })).toEqual({ nombre: "Nodo A", ubicacion: null });
  });

  it.each([
    ["sin nombre", {}],
    ["nombre vacío", { nombre: "" }],
    ["nombre de solo espacios", { nombre: "   " }],
    ["nombre de más de 80 caracteres", { nombre: "x".repeat(81) }],
    ["ubicación de más de 120 caracteres", { nombre: "Nodo A", ubicacion: "x".repeat(121) }],
    ["nombre que no es texto", { nombre: 7 }],
    ["cuerpo que no es un objeto", undefined],
  ])("#21 CA-3: rechaza al crear: %s", (_caso, entrada) => {
    expect(nodoCrearSchema.safeParse(entrada).success).toBe(false);
  });

  it("#21 CA-3: la edición acepta un subconjunto de campos", () => {
    expect(nodoEditarSchema.parse({ nombre: "Otro" })).toEqual({ nombre: "Otro" });
    expect(nodoEditarSchema.parse({ ubicacion: null })).toEqual({ ubicacion: null });
  });

  it("#21 CA-3: la edición rechaza un cuerpo sin campos y un nombre vacío", () => {
    expect(nodoEditarSchema.safeParse({}).success).toBe(false);
    expect(nodoEditarSchema.safeParse({ nombre: "" }).success).toBe(false);
  });

  it("#21 CA-3: la edición descarta el estado, que no es editable", () => {
    expect(nodoEditarSchema.parse({ nombre: "Otro", estado: "desconectado" })).toEqual({ nombre: "Otro" });
    expect(nodoEditarSchema.safeParse({ estado: "desconectado" }).success).toBe(false);
  });

  it("#21 CA-4: esUuid distingue un UUID de un identificador mal formado", () => {
    expect(esUuid("00000000-0000-4000-8000-000000000001")).toBe(true);
    expect(esUuid("no-es-un-uuid")).toBe(false);
  });
});
