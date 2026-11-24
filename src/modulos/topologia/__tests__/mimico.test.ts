import { describe, expect, it } from "vitest";
import type { EstadoNodo } from "@/modulos/estado/calculo";
import { armarMimico, desplazar, encuadre, estiloFlujo, zoomEn, type Caja } from "../mimico";
import type { Topologia } from "../service";

const estado = (id: string, extra: Partial<EstadoNodo> = {}): EstadoNodo => ({
  id,
  nombre: id,
  ubicacion: null,
  conexion: "conectado",
  nivel: "normal",
  sensores: 1,
  voltaje: 120,
  corriente: 10,
  potencia: 1200,
  tomadaEn: "2026-11-22T15:00:00.000Z",
  alertasActivas: 0,
  ...extra,
});

const topologia: Topologia = {
  nodos: [
    { id: "g", nombre: "Central", estado: "conectado", tipo: "generacion", x: 100, y: 200 },
    { id: "s", nombre: "Subestación", estado: "conectado", tipo: "subestacion", x: 400, y: 200 },
    { id: "c", nombre: "Carga", estado: "desconectado", tipo: "carga", x: 700, y: 400 },
    { id: "n", nombre: "Nuevo", estado: "conectado", tipo: null, x: null, y: null },
  ],
  enlaces: [
    { id: "e1", origenId: "g", destinoId: "s" },
    { id: "e2", origenId: "s", destinoId: "c" },
  ],
};

describe("datos del mímico", () => {
  const estados = [estado("g", { potencia: 3000 }), estado("s", { potencia: 1500, nivel: "advertencia" }), estado("c", { conexion: "desconectado", nivel: "desconectado" })];
  const m = armarMimico(topologia, estados);

  it("ui-scada: cada nodo lleva su posición, tipo y el estado de la instantánea", () => {
    expect(m.nodos.find((n) => n.id === "s")).toMatchObject({ x: 400, y: 200, tipo: "subestacion", nivel: "advertencia", potencia: 1500, sinUbicar: false });
  });

  it("ui-scada: un nodo sin ubicar se coloca debajo de la red, como carga, y queda marcado", () => {
    const n = m.nodos.find((x) => x.id === "n")!;
    expect(n.sinUbicar).toBe(true);
    expect(n.tipo).toBe("carga");
    expect(n.y).toBeGreaterThan(400);
  });

  it("ui-scada: un nodo sin instantánea queda sin datos", () => {
    expect(m.nodos.find((x) => x.id === "n")).toMatchObject({ nivel: "sin-datos", potencia: null });
  });

  it("ui-scada: el enlace lleva las coordenadas de sus extremos y fluye con la potencia del destino", () => {
    const e1 = m.enlaces.find((e) => e.id === "e1")!;
    expect(e1).toMatchObject({ x1: 100, y1: 200, x2: 400, y2: 200, activo: true });
    expect(e1.flujo).toEqual(estiloFlujo(1500, 3000));
  });

  it("ui-scada: un enlace con un extremo desconectado queda inactivo y sin flujo", () => {
    expect(m.enlaces.find((e) => e.id === "e2")).toMatchObject({ activo: false, flujo: null });
  });

  it("ui-scada: un enlace a un nodo que no está en la topología se descarta", () => {
    const otra = armarMimico({ ...topologia, enlaces: [{ id: "x", origenId: "g", destinoId: "fantasma" }] }, estados);
    expect(otra.enlaces).toEqual([]);
  });
});

describe("etiquetas del mímico", () => {
  it("ui-scada: un nombre largo se recorta con puntos suspensivos para no pisar a sus vecinos", async () => {
    const { nombreCorto } = await import("../mimico");
    expect(nombreCorto("Alimentador Residencial Laureles")).toBe("Alimentador Residencial Laureles");
    expect(nombreCorto("Alimentador Residencial Laureles del Norte")).toBe("Alimentador Residencial Laurele…");
  });
});

describe("flujo de energía", () => {
  it("ui-scada: más potencia es una línea más gruesa y un flujo más rápido", () => {
    const bajo = estiloFlujo(300, 3000)!;
    const alto = estiloFlujo(3000, 3000)!;
    expect(alto.grosor).toBeGreaterThan(bajo.grosor);
    expect(alto.duracionS).toBeLessThan(bajo.duracionS);
    expect(alto).toEqual({ grosor: 6, duracionS: 0.6 });
  });

  it("ui-scada: sin potencia no hay flujo", () => {
    expect(estiloFlujo(null, 3000)).toBeNull();
    expect(estiloFlujo(0, 3000)).toBeNull();
  });
});

describe("vista del mímico", () => {
  const vista: Caja = { x: 0, y: 0, ancho: 1000, alto: 500 };

  it("ui-scada: encuadrar abarca todos los nodos con margen", () => {
    expect(encuadre([{ x: 100, y: 200 }, { x: 700, y: 400 }], 50)).toEqual({ x: 50, y: 150, ancho: 700, alto: 300 });
  });

  it("ui-scada: encuadrar sin nodos devuelve un lienzo por defecto", () => {
    expect(encuadre([], 50)).toEqual({ x: 0, y: 0, ancho: 1200, alto: 700 });
  });

  it("ui-scada: acercar con la rueda conserva fijo el punto bajo el cursor", () => {
    const z = zoomEn(vista, 0.5, { x: 200, y: 100 });
    expect(z).toEqual({ x: 100, y: 50, ancho: 500, alto: 250 });
  });

  it("ui-scada: el zoom tiene límites para no perderse", () => {
    expect(zoomEn(vista, 0.01, { x: 0, y: 0 }).ancho).toBe(200);
    expect(zoomEn(vista, 100, { x: 0, y: 0 }).ancho).toBe(6000);
  });

  it("ui-scada: arrastrar el fondo mueve la vista en sentido contrario", () => {
    expect(desplazar(vista, 30, -20)).toEqual({ x: -30, y: 20, ancho: 1000, alto: 500 });
  });
});
