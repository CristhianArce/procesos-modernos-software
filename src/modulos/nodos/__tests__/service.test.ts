import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { buscarNodo, crearNodo, editarNodo, eliminarNodo, listarNodos, obtenerNodo } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const id = "00000000-0000-4000-8000-000000000001";
const nodo: repo.Nodo = { id, nombre: "Nodo A", ubicacion: null, estado: "conectado", creadoEn: "2026-11-22T00:00:00.000Z" };
const noEncontrado = { estado: 404, message: "Nodo no encontrado" };

beforeEach(() => vi.resetAllMocks());

describe("servicio de nodos", () => {
  it("#21 CA-1: crear y listar delegan en el repo", async () => {
    r.crear.mockResolvedValue(nodo);
    r.listar.mockResolvedValue([nodo]);
    expect(await crearNodo({ nombre: "Nodo A" })).toEqual(nodo);
    expect(r.crear).toHaveBeenCalledWith({ nombre: "Nodo A" });
    expect(await listarNodos()).toEqual([nodo]);
  });

  it("#21 CA-4: obtener, editar y eliminar lanzan 404 si el nodo no existe", async () => {
    r.buscar.mockResolvedValue(null);
    r.actualizar.mockResolvedValue(null);
    r.eliminar.mockResolvedValue(false);
    await expect(obtenerNodo(id)).rejects.toMatchObject(noEncontrado);
    await expect(editarNodo(id, { nombre: "Otro" })).rejects.toMatchObject(noEncontrado);
    await expect(eliminarNodo(id)).rejects.toMatchObject(noEncontrado);
  });

  it("#21 CA-4: un id que no es UUID lanza 404 sin llamar al repo", async () => {
    await expect(obtenerNodo("abc")).rejects.toMatchObject(noEncontrado);
    await expect(editarNodo("abc", { nombre: "Otro" })).rejects.toMatchObject(noEncontrado);
    await expect(eliminarNodo("abc")).rejects.toMatchObject(noEncontrado);
    expect(await buscarNodo("abc")).toBeNull();
    expect(r.buscar).not.toHaveBeenCalled();
    expect(r.actualizar).not.toHaveBeenCalled();
    expect(r.eliminar).not.toHaveBeenCalled();
  });

  it("#21 CA-4: obtener, editar y eliminar funcionan con un nodo existente", async () => {
    r.buscar.mockResolvedValue(nodo);
    r.actualizar.mockResolvedValue({ ...nodo, nombre: "Otro" });
    r.eliminar.mockResolvedValue(true);
    expect(await obtenerNodo(id)).toEqual(nodo);
    expect(await editarNodo(id, { nombre: "Otro" })).toMatchObject({ nombre: "Otro" });
    await expect(eliminarNodo(id)).resolves.toBeUndefined();
  });
});
