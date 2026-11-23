import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "../repo";
import { crearEnlace, eliminarEnlace, obtenerTopologia, posicionarNodo } from "../service";

vi.mock("../repo");
vi.mock("@/modulos/nodos/service");

const r = vi.mocked(repo);
const nodo = vi.mocked(obtenerNodo);
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
const enlace = { id: "00000000-0000-4000-8000-00000000e001", origenId: a, destinoId: b };

beforeEach(() => vi.resetAllMocks());

describe("servicio de topología", () => {
  it("ui-scada: la topología trae los nodos con su posición y los enlaces", async () => {
    const nodos = [{ id: a, nombre: "N", estado: "conectado" as const, tipo: null, x: null, y: null }];
    r.listarNodos.mockResolvedValue(nodos);
    r.listarEnlaces.mockResolvedValue([enlace]);
    expect(await obtenerTopologia()).toEqual({ nodos, enlaces: [enlace] });
  });

  it("ui-scada: ubicar un nodo comprueba que existe y guarda su posición", async () => {
    const posicion = { tipo: "carga" as const, x: 10, y: 20 };
    r.guardarPosicion.mockResolvedValue({ nodoId: a, ...posicion });
    expect(await posicionarNodo(a, posicion)).toEqual({ nodoId: a, ...posicion });
    expect(nodo).toHaveBeenCalledWith(a);
    expect(r.guardarPosicion).toHaveBeenCalledWith(a, posicion);
  });

  it("ui-scada: ubicar un nodo que no existe responde 404 sin guardar", async () => {
    nodo.mockRejectedValue(new ErrorHttp(404, "Nodo no encontrado"));
    await expect(posicionarNodo(a, { tipo: "carga", x: 1, y: 1 })).rejects.toMatchObject({ estado: 404 });
    expect(r.guardarPosicion).not.toHaveBeenCalled();
  });

  it("ui-scada: crear un enlace comprueba ambos nodos y lo devuelve", async () => {
    r.crearEnlace.mockResolvedValue(enlace);
    expect(await crearEnlace({ origenId: a, destinoId: b })).toEqual(enlace);
    expect(nodo.mock.calls).toEqual([[a], [b]]);
  });

  it("ui-scada: un enlace repetido responde 409", async () => {
    r.crearEnlace.mockResolvedValue(null);
    await expect(crearEnlace({ origenId: a, destinoId: b })).rejects.toMatchObject({ estado: 409, message: "Ya existe un enlace entre esos nodos" });
  });

  it("ui-scada: borrar un enlace inexistente o con id inválido responde 404", async () => {
    r.eliminarEnlace.mockResolvedValue(false);
    await expect(eliminarEnlace(enlace.id)).rejects.toMatchObject({ estado: 404, message: "Enlace no encontrado" });
    await expect(eliminarEnlace("no-es-uuid")).rejects.toMatchObject({ estado: 404 });
    expect(r.eliminarEnlace).toHaveBeenCalledTimes(1);
  });

  it("ui-scada: borrar un enlace existente no devuelve nada", async () => {
    r.eliminarEnlace.mockResolvedValue(true);
    await expect(eliminarEnlace(enlace.id)).resolves.toBeUndefined();
  });
});
