import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import { registrarLecturas } from "@/modulos/lecturas/service";
import { listarSensores, type SensorConLectura } from "@/modulos/sensores/service";
import { simular } from "../service";

vi.mock("@/modulos/lecturas/service");
vi.mock("@/modulos/sensores/service");

const sensores = vi.mocked(listarSensores);
const registrar = vi.mocked(registrarLecturas);

const nodoId = "00000000-0000-4000-8000-000000000001";
const sensor = (id: string): SensorConLectura => ({
  id,
  nodoId,
  nombre: id,
  umbralVoltaje: null,
  umbralCorriente: null,
  umbralPotencia: null,
  creadoEn: "2026-11-22T00:00:00.000Z",
  ultimaLectura: null,
});

beforeEach(() => {
  vi.resetAllMocks();
  registrar.mockImplementation(async (nuevas) => nuevas.map((n, i) => ({ ...n, id: `l${i}`, tomadaEn: "2026-11-22T00:00:00.000Z" })));
});

describe("servicio del simulador", () => {
  it("#21 CA-6: registra una lectura de voltaje, corriente y potencia por cada sensor del nodo", async () => {
    sensores.mockResolvedValue([sensor("s1"), sensor("s2")]);
    const lecturas = await simular(nodoId, () => 0.5);
    expect(lecturas.map((l) => l.sensorId)).toEqual(["s1", "s2"]);
    expect(registrar).toHaveBeenCalledWith([
      { sensorId: "s1", voltaje: 120, corriente: 10.25, potencia: 1230 },
      { sensorId: "s2", voltaje: 120, corriente: 10.25, potencia: 1230 },
    ]);
  });

  it("#21 CA-6: un nodo sin sensores devuelve cero lecturas", async () => {
    sensores.mockResolvedValue([]);
    expect(await simular(nodoId)).toEqual([]);
    expect(registrar).toHaveBeenCalledWith([]);
  });

  it("#21 CA-4: un nodo inexistente lanza 404 y no registra nada", async () => {
    sensores.mockRejectedValue(new ErrorHttp(404, "Nodo no encontrado"));
    await expect(simular(nodoId)).rejects.toMatchObject({ estado: 404 });
    expect(registrar).not.toHaveBeenCalled();
  });
});
