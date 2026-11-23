import { describe, expect, it } from "vitest";
import { filtrarAlarmas, ordenarAlarmas, severidad, type AlertaReciente } from "../alarmas";
import { armarNodos } from "../calculo";
import { alertasNuevas, apilarAvisos, conservarIguales, fusionarInstantanea } from "../fusion";
import { compactarNodos, type InstantaneaViva } from "../vivo";

const alerta = (id: string, extra: Partial<AlertaReciente> = {}): AlertaReciente => ({
  id,
  nodoId: "n1",
  nodoNombre: "Subestación Norte",
  sensorNombre: "Transformador principal",
  magnitud: "voltaje",
  valor: 126,
  umbral: 125,
  creadaEn: "2026-11-22T15:00:00.000Z",
  ...extra,
});

describe("severidad y orden de las alarmas", () => {
  it("ui-scada: un exceso de 10 % o más sobre el umbral es alta; uno menor, media", () => {
    expect(severidad(alerta("a", { valor: 137.5, umbral: 125 }))).toEqual({ nivel: "alta", exceso: 0.1 });
    expect(severidad(alerta("a", { valor: 130, umbral: 125 }))).toEqual({ nivel: "media", exceso: 0.04 });
  });

  it("ui-scada: ordena por severidad y, dentro de cada una, de la más reciente a la más antigua", () => {
    const lista = [
      alerta("media-vieja", { valor: 126, creadaEn: "2026-11-22T15:00:00.000Z" }),
      alerta("alta-vieja", { valor: 200, creadaEn: "2026-11-22T14:00:00.000Z" }),
      alerta("media-nueva", { valor: 127, creadaEn: "2026-11-22T16:00:00.000Z" }),
      alerta("alta-nueva", { valor: 150, creadaEn: "2026-11-22T15:30:00.000Z" }),
    ];
    expect(ordenarAlarmas(lista).map((a) => a.id)).toEqual(["alta-nueva", "alta-vieja", "media-nueva", "media-vieja"]);
  });

  it("ui-scada: filtra por nodo y por magnitud; sin filtro devuelve todas", () => {
    const lista = [alerta("a"), alerta("b", { nodoId: "n2" }), alerta("c", { magnitud: "corriente" })];
    expect(filtrarAlarmas(lista, { nodoId: "n2", magnitud: null }).map((a) => a.id)).toEqual(["b"]);
    expect(filtrarAlarmas(lista, { nodoId: null, magnitud: "corriente" }).map((a) => a.id)).toEqual(["c"]);
    expect(filtrarAlarmas(lista, { nodoId: null, magnitud: null })).toHaveLength(3);
  });
});

describe("instantánea compacta", () => {
  it("ui-scada: cada nodo viaja sin nombre ni ubicación y con cifras de dos decimales", () => {
    const [n] = armarNodos(
      [
        {
          nodoId: "n1",
          nombre: "N",
          ubicacion: "U",
          conexion: "conectado",
          sensorId: "s",
          umbralVoltaje: 125,
          umbralCorriente: null,
          umbralPotencia: null,
          lectura: { voltaje: 120.123456, corriente: 1.006, potencia: 120.9999, tomadaEn: "2026-11-22T15:00:00.000Z" },
        },
      ],
      new Map(),
    );
    expect(compactarNodos([n])).toEqual([
      { id: "n1", conexion: "conectado", nivel: "normal", voltaje: 120.12, corriente: 1.01, potencia: 121, tomadaEn: "2026-11-22T15:00:00.000Z", alertasActivas: 0 },
    ]);
  });
});

describe("repintar solo lo que cambió", () => {
  it("ui-scada: conserva el objeto anterior de cada elemento igual y usa el nuevo para los que cambiaron", () => {
    const antes = [
      { id: "a", v: 1 },
      { id: "b", v: 2 },
    ];
    const despues = conservarIguales(antes, [
      { id: "a", v: 1 },
      { id: "b", v: 3 },
      { id: "c", v: 4 },
    ]);
    expect(despues[0]).toBe(antes[0]);
    expect(despues[1]).not.toBe(antes[1]);
    expect(despues.map((x) => x.v)).toEqual([1, 3, 4]);
  });

  it("ui-scada: si nada cambió devuelve la misma lista", () => {
    const antes = [{ id: "a", v: 1 }];
    expect(conservarIguales(antes, [{ id: "a", v: 1 }])).toBe(antes);
  });
});

describe("fusión de instantáneas", () => {
  const indicadores = {
    potenciaTotal: 1,
    tensionMedia: 120,
    nodosConectados: 1,
    nodosDesconectados: 0,
    nodosTotales: 1,
    alertasActivas: 0,
    tendencia: { potencia: [], tension: [], nodos: [], alertas: [] },
  };
  const nodo = { id: "n1", conexion: "conectado" as const, nivel: "normal" as const, voltaje: 120, corriente: 1, potencia: 120, tomadaEn: null, alertasActivas: 0 };
  const base: InstantaneaViva = { generadaEn: "t0", indicadores, nodos: [nodo], alertas: [alerta("a")] };

  it("ui-scada: conserva los nodos, alertas e indicadores que no cambiaron", async () => {
    const siguiente = fusionarInstantanea(base, JSON.parse(JSON.stringify({ ...base, generadaEn: "t1" })));
    expect(siguiente.generadaEn).toBe("t1");
    expect(siguiente.nodos).toBe(base.nodos);
    expect(siguiente.alertas).toBe(base.alertas);
    expect(siguiente.indicadores).toBe(base.indicadores);
  });

  it("ui-scada: un aviso nuevo del mismo sensor y magnitud reemplaza al anterior en vez de apilarse", () => {
    const antes = [alerta("a"), alerta("x", { sensorNombre: "Otro" })];
    const despues = apilarAvisos(antes, [alerta("b"), alerta("c", { magnitud: "corriente" })]);
    expect(despues.map((a) => a.id)).toEqual(["b", "c", "x"]);
  });

  it("ui-scada: detecta las alertas nuevas frente a las ya vistas", () => {
    expect(alertasNuevas(new Set(["a"]), [alerta("b"), alerta("a")]).map((a) => a.id)).toEqual(["b"]);
  });
});
