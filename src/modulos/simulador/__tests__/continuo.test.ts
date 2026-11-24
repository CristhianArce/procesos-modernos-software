import { beforeEach, describe, expect, it, vi } from "vitest";
import { registrarAlertas } from "@/modulos/alertas/service";
import type { FilaSensor } from "@/modulos/estado/calculo";
import { filasDeSensores } from "@/modulos/estado/service";
import { podarLecturas, registrarLecturas } from "@/modulos/lecturas/service";
import { RETENCION_MIN, crearSimulador } from "../continuo";

vi.mock("@/modulos/estado/service");
vi.mock("@/modulos/lecturas/service");
vi.mock("@/modulos/alertas/service");

const filas = vi.mocked(filasDeSensores);
const registrar = vi.mocked(registrarLecturas);
const alertas = vi.mocked(registrarAlertas);
const podar = vi.mocked(podarLecturas);

const fila = (extra: Partial<FilaSensor>): FilaSensor => ({
  nodoId: "n1",
  nombre: "N",
  ubicacion: null,
  conexion: "conectado",
  sensorId: "s1",
  umbralVoltaje: 125,
  umbralCorriente: 15,
  umbralPotencia: null,
  lectura: { voltaje: 121, corriente: 9, potencia: 1089, tomadaEn: "2026-11-22T15:00:00.000Z" },
  ...extra,
});

beforeEach(() => {
  vi.resetAllMocks();
  registrar.mockImplementation(async (nuevas) => nuevas.map((n, i) => ({ ...n, id: `l${i}`, tomadaEn: "2026-11-22T15:00:03.000Z" })));
  alertas.mockResolvedValue([]);
  podar.mockResolvedValue(7);
});

describe("simulador continuo", () => {
  it("ui-scada: registra una lectura por sensor de los nodos conectados y omite desconectados y nodos sin sensores", async () => {
    filas.mockResolvedValue([
      fila({ sensorId: "s1" }),
      fila({ sensorId: "s2", nodoId: "n2", conexion: "desconectado" }),
      fila({ sensorId: null, nodoId: "n3", lectura: null }),
    ]);
    const r = await crearSimulador({ azar: () => 0.5 }).paso();
    expect(registrar).toHaveBeenCalledWith([{ sensorId: "s1", voltaje: 120.8, corriente: 9, potencia: 1087.2 }]);
    expect(r.lecturas).toBe(1);
  });

  it("ui-scada: evalúa las alertas por el mismo camino que el botón, con los umbrales de cada sensor", async () => {
    filas.mockResolvedValue([fila({})]);
    await crearSimulador({ azar: () => 0.5 }).paso();
    expect(alertas).toHaveBeenCalledWith(expect.any(Array), [
      { id: "s1", umbralVoltaje: 125, umbralCorriente: 15, umbralPotencia: null },
    ]);
  });

  it("ui-scada: cada paso parte de la lectura anterior (deriva), no de un valor nuevo al azar", async () => {
    filas.mockResolvedValue([fila({})]);
    const sim = crearSimulador({ azar: () => 0.5 });
    await sim.paso();
    await sim.paso();
    const [primero, segundo] = registrar.mock.calls.map((c) => c[0][0].voltaje);
    expect(primero).toBe(120.8);
    expect(segundo).toBe(120.64); // 120,8 + 20 % de (120 − 120,8)
  });

  it("ui-scada: poda las lecturas antiguas cada cierto número de pasos", async () => {
    filas.mockResolvedValue([fila({})]);
    const sim = crearSimulador({ azar: () => 0.5, podarCada: 2 });
    expect((await sim.paso()).podadas).toBe(0);
    expect((await sim.paso()).podadas).toBe(7);
    expect(podar).toHaveBeenCalledTimes(1);
    expect(podar).toHaveBeenCalledWith(RETENCION_MIN);
  });

  it("ui-scada: sin sensores conectados no registra nada", async () => {
    filas.mockResolvedValue([fila({ conexion: "desconectado" })]);
    expect((await crearSimulador({ azar: () => 0.5 }).paso()).lecturas).toBe(0);
    expect(registrar).not.toHaveBeenCalled();
  });
});
