import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import type { Lectura } from "@/modulos/lecturas/service";
import { registro } from "@/nav/registro";
import * as repo from "../repo";
import { excesos, listarAlertas, registrarAlertas } from "../service";

vi.mock("../repo");
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/nav/registro", () => ({ registro: { suscriptores: [] } }));

const r = vi.mocked(repo);
const suscriptores = registro.suscriptores as { modulo: string; manejar: (a: unknown) => unknown }[];

const sensor = { id: "s1", umbralVoltaje: 125, umbralCorriente: 15, umbralPotencia: null };
const lectura = (valores: Partial<Lectura> = {}): Lectura => ({
  id: "l1",
  sensorId: "s1",
  voltaje: 120,
  corriente: 10,
  potencia: 1200,
  tomadaEn: "2026-11-22T00:00:00.000Z",
  ...valores,
});
const guardada = (n: repo.AlertaNueva, i = 0): repo.Alerta => ({ ...n, id: `a${i}`, creadaEn: "2026-11-22T00:00:01.000Z" });

beforeEach(() => {
  vi.resetAllMocks();
  suscriptores.length = 0;
  r.insertar.mockImplementation(async (nuevas) => nuevas.map(guardada));
});

describe("excesos de una lectura", () => {
  it("#22 CA-3: crea una alerta con sensor, magnitud, valor y umbral si el valor supera el umbral", () => {
    expect(excesos(lectura({ voltaje: 130 }), sensor)).toEqual([{ sensorId: "s1", magnitud: "voltaje", valor: 130, umbral: 125 }]);
  });

  it("#22 CA-3: no crea alerta si el valor es igual o menor que el umbral", () => {
    expect(excesos(lectura({ voltaje: 125, corriente: 14.9 }), sensor)).toEqual([]);
  });

  it("#22 CA-3: no crea alerta si la magnitud no tiene umbral", () => {
    expect(excesos(lectura({ potencia: 99999 }), sensor)).toEqual([]);
  });

  it("#22 CA-3: una lectura que supera dos umbrales crea dos alertas", () => {
    expect(excesos(lectura({ voltaje: 130, corriente: 16 }), sensor).map((a) => a.magnitud)).toEqual(["voltaje", "corriente"]);
  });
});

describe("servicio de alertas", () => {
  it("#22 CA-3: sin excesos no llama al repo", async () => {
    expect(await registrarAlertas([lectura()], [sensor])).toEqual([]);
    expect(r.insertar).not.toHaveBeenCalled();
  });

  it("#22 CA-3: guarda las alertas de todas las lecturas en una sola llamada", async () => {
    const alertas = await registrarAlertas([lectura({ voltaje: 130 }), lectura({ id: "l2", corriente: 16 })], [sensor]);
    expect(r.insertar).toHaveBeenCalledTimes(1);
    expect(alertas.map((a) => a.magnitud)).toEqual(["voltaje", "corriente"]);
  });

  it("#22 CA-5: avisa al suscriptor con la alerta guardada, con su identificador", async () => {
    const manejar = vi.fn();
    suscriptores.push({ modulo: "avisos", manejar });
    const [alerta] = await registrarAlertas([lectura({ voltaje: 130 })], [sensor]);
    expect(manejar).toHaveBeenCalledWith(alerta);
    expect(alerta).toMatchObject({ id: "a0", sensorId: "s1", magnitud: "voltaje", valor: 130, umbral: 125, creadaEn: expect.any(String) });
  });

  it("#22 CA-5: si un suscriptor falla, registra el error, la alerta queda guardada y avisa al siguiente", async () => {
    const siguiente = vi.fn();
    suscriptores.push({ modulo: "roto", manejar: () => Promise.reject(new Error("caído")) }, { modulo: "avisos", manejar: siguiente });
    const alertas = await registrarAlertas([lectura({ voltaje: 130 })], [sensor]);
    expect(alertas).toHaveLength(1);
    expect(r.insertar).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(expect.objectContaining({ modulo: "roto", alertaId: "a0" }), expect.any(String));
    expect(siguiente).toHaveBeenCalledWith(alertas[0]);
  });

  it("#22 CA-4: listar delega en el repo con la consulta", async () => {
    r.recientes.mockResolvedValue([]);
    await listarAlertas({ limite: 20 });
    expect(r.recientes).toHaveBeenCalledWith({ limite: 20 });
  });
});
