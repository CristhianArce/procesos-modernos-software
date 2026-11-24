import { describe, expect, it } from "vitest";
import { enlaceCrearSchema, posicionSchema } from "../schema";

const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";

describe("esquemas de la topología", () => {
  it("ui-scada: una posición válida trae un tipo conocido y coordenadas dentro del lienzo", () => {
    expect(posicionSchema.parse({ tipo: "subestacion", x: 340, y: 0 })).toEqual({ tipo: "subestacion", x: 340, y: 0 });
  });

  it.each([
    ["un tipo desconocido", { tipo: "nave", x: 1, y: 1 }],
    ["una coordenada negativa", { tipo: "carga", x: -1, y: 1 }],
    ["una coordenada fuera del lienzo", { tipo: "carga", x: 1, y: 2001 }],
    ["una coordenada que no es número", { tipo: "carga", x: "10", y: 1 }],
    ["una coordenada infinita", { tipo: "carga", x: Infinity, y: 1 }],
    ["un cuerpo vacío", {}],
  ])("ui-scada: rechaza una posición con %s", (_caso, cuerpo) => {
    expect(posicionSchema.safeParse(cuerpo).success).toBe(false);
  });

  it("ui-scada: un enlace une dos nodos distintos identificados por UUID", () => {
    expect(enlaceCrearSchema.parse({ origenId: a, destinoId: b })).toEqual({ origenId: a, destinoId: b });
    expect(enlaceCrearSchema.safeParse({ origenId: a, destinoId: "x" }).success).toBe(false);
  });

  it("ui-scada: un enlace de un nodo consigo mismo se rechaza señalando el destino", () => {
    const r = enlaceCrearSchema.safeParse({ origenId: a, destinoId: a });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["destinoId"]);
  });
});
