import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { cambiarEstadoNodo } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const id = "00000000-0000-4000-8000-000000000001";
const noEncontrado = { estado: 404, message: "Nodo no encontrado" };

beforeEach(() => vi.resetAllMocks());

describe("servicio de aislamiento", () => {
  it("#23 CA-1: devuelve lo que devuelve el repo y lo llama con el id y el destino", async () => {
    r.cambiarEstado.mockResolvedValue({ id, estado: "desconectado" });
    expect(await cambiarEstadoNodo(id, "desconectado")).toEqual({ id, estado: "desconectado" });
    expect(r.cambiarEstado).toHaveBeenCalledWith(id, "desconectado");
  });

  it("#23 CA-2: reconectar y repetir el destino también delegan en el repo", async () => {
    r.cambiarEstado.mockResolvedValue({ id, estado: "conectado" });
    expect(await cambiarEstadoNodo(id, "conectado")).toEqual({ id, estado: "conectado" });
    expect(await cambiarEstadoNodo(id, "conectado")).toEqual({ id, estado: "conectado" });
  });

  it("#23 CA-4: lanza 404 si el repo no encuentra el nodo", async () => {
    r.cambiarEstado.mockResolvedValue(null);
    await expect(cambiarEstadoNodo(id, "desconectado")).rejects.toMatchObject(noEncontrado);
  });

  it("#23 CA-4: un id que no es UUID lanza 404 sin llamar al repo", async () => {
    await expect(cambiarEstadoNodo("abc", "desconectado")).rejects.toMatchObject(noEncontrado);
    expect(r.cambiarEstado).not.toHaveBeenCalled();
  });
});
