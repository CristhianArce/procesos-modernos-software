import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import { ultimasLecturas, type Lectura } from "@/modulos/lecturas/service";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "../repo";
import { crearSensor, editarSensor, eliminarSensor, listarSensores, obtenerSensor } from "../service";

vi.mock("../repo");
vi.mock("@/modulos/nodos/service");
vi.mock("@/modulos/lecturas/service");

const r = vi.mocked(repo);
const nodo = vi.mocked(obtenerNodo);
const ultimas = vi.mocked(ultimasLecturas);

const nodoId = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000101";
const sensor: repo.Sensor = {
  id,
  nodoId,
  nombre: "S1",
  umbralVoltaje: 125,
  umbralCorriente: null,
  umbralPotencia: null,
  creadoEn: "2026-11-22T00:00:00.000Z",
};
const lectura: Lectura = { id: "l1", sensorId: id, voltaje: 120, corriente: 10, potencia: 1200, tomadaEn: "2026-11-22T01:00:00.000Z" };
const sinNodo = new ErrorHttp(404, "Nodo no encontrado");
const noEncontrado = { estado: 404, message: "Sensor no encontrado" };

beforeEach(() => {
  vi.resetAllMocks();
  ultimas.mockResolvedValue(new Map());
});

describe("servicio de sensores", () => {
  it("#21 CA-2: crear asocia el sensor al nodo y lo devuelve sin lecturas", async () => {
    r.crear.mockResolvedValue(sensor);
    expect(await crearSensor({ nodoId, nombre: "S1", umbralVoltaje: 125 })).toEqual({ ...sensor, ultimaLectura: null });
    expect(nodo).toHaveBeenCalledWith(nodoId);
  });

  it("#21 CA-4: crear o listar para un nodo inexistente lanza 404 y no crea nada", async () => {
    nodo.mockRejectedValue(sinNodo);
    await expect(crearSensor({ nodoId, nombre: "S1" })).rejects.toMatchObject({ estado: 404 });
    await expect(listarSensores(nodoId)).rejects.toMatchObject({ estado: 404 });
    expect(r.crear).not.toHaveBeenCalled();
    expect(r.listarPorNodo).not.toHaveBeenCalled();
  });

  it("#21 CA-6: cada sensor trae su última lectura, o null si no tiene", async () => {
    const otro = { ...sensor, id: "00000000-0000-4000-8000-000000000102" };
    r.listarPorNodo.mockResolvedValue([sensor, otro]);
    ultimas.mockResolvedValue(new Map([[id, lectura]]));
    const sensores = await listarSensores(nodoId);
    expect(sensores.map((s) => s.ultimaLectura)).toEqual([lectura, null]);
    expect(ultimas).toHaveBeenCalledWith([id, otro.id]);
  });

  it("#21 CA-4: obtener, editar y eliminar lanzan 404 si el sensor no existe", async () => {
    r.buscar.mockResolvedValue(null);
    r.actualizar.mockResolvedValue(null);
    r.eliminar.mockResolvedValue(false);
    await expect(obtenerSensor(id)).rejects.toMatchObject(noEncontrado);
    await expect(editarSensor(id, { nombre: "S2" })).rejects.toMatchObject(noEncontrado);
    await expect(eliminarSensor(id)).rejects.toMatchObject(noEncontrado);
  });

  it("#21 CA-4: un id que no es UUID lanza 404 sin llamar al repo", async () => {
    await expect(obtenerSensor("abc")).rejects.toMatchObject(noEncontrado);
    await expect(editarSensor("abc", { nombre: "S2" })).rejects.toMatchObject(noEncontrado);
    await expect(eliminarSensor("abc")).rejects.toMatchObject(noEncontrado);
    expect(r.buscar).not.toHaveBeenCalled();
    expect(r.actualizar).not.toHaveBeenCalled();
    expect(r.eliminar).not.toHaveBeenCalled();
  });

  it("#21 CA-6: obtener y editar devuelven el sensor con su última lectura", async () => {
    r.buscar.mockResolvedValue(sensor);
    r.actualizar.mockResolvedValue({ ...sensor, nombre: "S2" });
    ultimas.mockResolvedValue(new Map([[id, lectura]]));
    expect(await obtenerSensor(id)).toEqual({ ...sensor, ultimaLectura: lectura });
    expect(await editarSensor(id, { nombre: "S2" })).toMatchObject({ nombre: "S2", ultimaLectura: lectura });
  });
});
