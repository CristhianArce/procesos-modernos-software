import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { registrarLecturas, ultimasLecturas } from "../service";

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
});
