import { describe, expect, it } from "vitest";
import { armarNodos, calcularIndicadores, type FilaSensor, type PuntoTendencia } from "../calculo";

const nodo = { nodoId: "n1", nombre: "Subestación Norte", ubicacion: "Bello", conexion: "conectado" as const };
const umbrales = { umbralVoltaje: 125, umbralCorriente: 15, umbralPotencia: 1800 };
const lectura = (voltaje: number, corriente: number, potencia: number, tomadaEn = "2026-11-22T15:00:00.000Z") => ({ voltaje, corriente, potencia, tomadaEn });

const fila = (extra: Partial<FilaSensor> = {}): FilaSensor => ({
  ...nodo,
  sensorId: "s1",
  ...umbrales,
  lectura: lectura(120, 10, 1200),
  ...extra,
});

describe("estado de cada nodo", () => {
  it("ui-scada: agrupa los sensores por nodo: tensión media, corriente y potencia sumadas, la fecha más reciente", () => {
    const [n] = armarNodos(
      [
        fila({ sensorId: "s1", lectura: lectura(120, 10, 1200, "2026-11-22T15:00:00.000Z") }),
        fila({ sensorId: "s2", lectura: lectura(118, 5, 590, "2026-11-22T15:00:05.000Z") }),
      ],
      new Map(),
    );
    expect(n).toMatchObject({ id: "n1", nombre: "Subestación Norte", ubicacion: "Bello", conexion: "conectado", sensores: 2 });
    expect(n.voltaje).toBe(119);
    expect(n.corriente).toBe(15);
    expect(n.potencia).toBe(1790);
    expect(n.tomadaEn).toBe("2026-11-22T15:00:05.000Z");
    expect(n.nivel).toBe("normal");
  });

  it("ui-scada: el nivel del nodo es el peor de sus sensores y magnitudes frente a los umbrales", () => {
    const filas = [fila({ sensorId: "s1" }), fila({ sensorId: "s2", lectura: lectura(120, 16, 1000) })];
    expect(armarNodos(filas, new Map())[0].nivel).toBe("critico");
    expect(armarNodos([fila({ lectura: lectura(123, 1, 1) })], new Map())[0].nivel).toBe("advertencia");
  });

  it("ui-scada: un nodo desconectado queda desconectado aunque sus lecturas superen el umbral", () => {
    const [n] = armarNodos([fila({ conexion: "desconectado", lectura: lectura(200, 1, 1) })], new Map());
    expect(n.nivel).toBe("desconectado");
  });

  it("ui-scada: un nodo sin sensores o sin lecturas queda sin datos y sin cifras", () => {
    const [sinSensores, sinLecturas] = armarNodos(
      [
        { ...nodo, sensorId: null, umbralVoltaje: null, umbralCorriente: null, umbralPotencia: null, lectura: null },
        { ...nodo, nodoId: "n2", sensorId: "s9", ...umbrales, lectura: null },
      ],
      new Map(),
    );
    expect(sinSensores).toMatchObject({ sensores: 0, nivel: "sin-datos", voltaje: null, potencia: null, tomadaEn: null });
    expect(sinLecturas).toMatchObject({ id: "n2", sensores: 1, nivel: "sin-datos" });
  });

  it("ui-scada: cada nodo lleva sus alertas activas y conserva el orden de llegada", () => {
    const nodos = armarNodos([fila(), fila({ nodoId: "n2", nombre: "Otro" })], new Map([["n2", 3]]));
    expect(nodos.map((n) => [n.id, n.alertasActivas])).toEqual([
      ["n1", 0],
      ["n2", 3],
    ]);
  });
});

describe("indicadores de la red", () => {
  const nodos = armarNodos(
    [
      fila({ nodoId: "a", lectura: lectura(120, 10, 1000) }),
      fila({ nodoId: "b", lectura: lectura(124, 10, 2000) }),
      fila({ nodoId: "c", conexion: "desconectado", lectura: lectura(200, 10, 9000) }),
      { ...nodo, nodoId: "d", sensorId: null, umbralVoltaje: null, umbralCorriente: null, umbralPotencia: null, lectura: null },
    ],
    new Map([
      ["a", 1],
      ["c", 2],
    ]),
  );
  const tendencia: PuntoTendencia[] = [
    { tensionMedia: 121, potenciaTotal: 2900, nodosReportando: 2, alertas: 0 },
    { tensionMedia: 122, potenciaTotal: 3000, nodosReportando: 2, alertas: 3 },
  ];

  it("ui-scada: suma la potencia y promedia la tensión solo de los nodos conectados con datos", () => {
    const k = calcularIndicadores(nodos, tendencia);
    expect(k.potenciaTotal).toBe(3000);
    expect(k.tensionMedia).toBe(122);
  });

  it("ui-scada: cuenta nodos conectados, desconectados y alertas activas", () => {
    expect(calcularIndicadores(nodos, tendencia)).toMatchObject({ nodosConectados: 3, nodosDesconectados: 1, nodosTotales: 4, alertasActivas: 3 });
  });

  it("ui-scada: arma una serie por indicador a partir de la tendencia", () => {
    expect(calcularIndicadores(nodos, tendencia).tendencia).toEqual({
      potencia: [2900, 3000],
      tension: [121, 122],
      nodos: [2, 2],
      alertas: [0, 3],
    });
  });

  it("ui-scada: sin nodos con datos, la potencia y la tensión quedan vacías", () => {
    const k = calcularIndicadores([], []);
    expect(k).toMatchObject({ potenciaTotal: null, tensionMedia: null, nodosConectados: 0, alertasActivas: 0 });
  });
});
