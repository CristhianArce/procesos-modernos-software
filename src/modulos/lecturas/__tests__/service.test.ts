import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { lecturasRecientesPorSensor, listarLecturas, registrarLecturas, ultimasLecturas } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const lectura = (sensorId: string): repo.Lectura => ({
  id: `l-${sensorId}`,
  sensorId,
  voltaje: 120,
  corriente: 10,
  potencia: 1200,
  tomadaEn: "2026-11-22T00:00:00.000Z",
});

beforeEach(() => vi.resetAllMocks());

describe("servicio de lecturas", () => {
  it("#21 CA-6: registrar una lista vacía no llama al repo", async () => {
    expect(await registrarLecturas([])).toEqual([]);
    expect(r.insertar).not.toHaveBeenCalled();
  });

  it("#21 CA-6: registra las lecturas nuevas con el repo", async () => {
    r.insertar.mockResolvedValue([lectura("s1")]);
    const nuevas = [{ sensorId: "s1", voltaje: 120, corriente: 10, potencia: 1200 }];
    expect(await registrarLecturas(nuevas)).toEqual([lectura("s1")]);
    expect(r.insertar).toHaveBeenCalledWith(nuevas);
  });

  it("#21 CA-6: las últimas lecturas quedan indexadas por sensor", async () => {
    r.ultimasPorSensor.mockResolvedValue([lectura("s1")]);
    const ultimas = await ultimasLecturas(["s1", "s2"]);
    expect(ultimas.get("s1")).toEqual(lectura("s1"));
    expect(ultimas.has("s2")).toBe(false);
  });

  it("#21 CA-6: sin sensores no consulta el repo", async () => {
    expect((await ultimasLecturas([])).size).toBe(0);
    expect(r.ultimasPorSensor).not.toHaveBeenCalled();
  });

  it("#22 CA-6: listar delega en el repo con la consulta", async () => {
    r.recientes.mockResolvedValue([lectura("s1")]);
    expect(await listarLecturas({ sensorId: "s1", limite: 2 })).toEqual([lectura("s1")]);
    expect(r.recientes).toHaveBeenCalledWith({ sensorId: "s1", limite: 2 });
  });

  it("#22 CA-2: las lecturas recientes quedan indexadas por sensor, en el orden del repo", async () => {
    const segunda = { ...lectura("s1"), id: "l-s1-b" };
    r.recientesPorSensor.mockResolvedValue([lectura("s1"), segunda, lectura("s2")]);
    const series = await lecturasRecientesPorSensor(["s1", "s2", "s3"], 50);
    expect(series.get("s1")).toEqual([lectura("s1"), segunda]);
    expect(series.get("s2")).toEqual([lectura("s2")]);
    expect(series.has("s3")).toBe(false);
    expect(r.recientesPorSensor).toHaveBeenCalledWith(["s1", "s2", "s3"], 50);
  });

  it("#22 CA-2: sin sensores no consulta las lecturas recientes", async () => {
    expect((await lecturasRecientesPorSensor([], 50)).size).toBe(0);
    expect(r.recientesPorSensor).not.toHaveBeenCalled();
  });
});
