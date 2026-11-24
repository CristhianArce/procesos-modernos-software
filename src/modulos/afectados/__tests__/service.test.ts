import { beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "../repo";
import { listarAfectados } from "../service";

vi.mock("../repo");
vi.mock("@/modulos/nodos/service");

const r = vi.mocked(repo);
const nodo = vi.mocked(obtenerNodo);
const id = "00000000-0000-4000-8000-000000000002";
const afectado = (n: number, alias: string) => ({
  id: `00000000-0000-4000-8000-0000000a000${n}`,
  alias,
  creadoEn: `2026-11-24T10:0${n}:00.000Z`,
});

beforeEach(() => vi.resetAllMocks());

describe("servicio de afectados", () => {
  it("#25 CA-1: devuelve la lista del repo con un total igual a su largo", async () => {
    const lista = [afectado(1, "Usuario demo 02"), afectado(2, "Usuario demo 03"), afectado(3, "Usuario demo 02")];
    nodo.mockResolvedValue({ id } as Awaited<ReturnType<typeof obtenerNodo>>);
    r.listarPorNodo.mockResolvedValue(lista);
    expect(await listarAfectados(id)).toEqual({ total: 3, afectados: lista });
    expect(nodo).toHaveBeenCalledWith(id);
    expect(r.listarPorNodo).toHaveBeenCalledWith(id);
  });

  it("#25 CA-3: un nodo sin afectados devuelve total 0 y lista vacía", async () => {
    nodo.mockResolvedValue({ id } as Awaited<ReturnType<typeof obtenerNodo>>);
    r.listarPorNodo.mockResolvedValue([]);
    expect(await listarAfectados(id)).toEqual({ total: 0, afectados: [] });
  });

  it("#25 CA-3: propaga el 404 de obtenerNodo sin llamar al repo", async () => {
    nodo.mockRejectedValue({ estado: 404, message: "Nodo no encontrado" });
    await expect(listarAfectados(id)).rejects.toMatchObject({ estado: 404, message: "Nodo no encontrado" });
    expect(r.listarPorNodo).not.toHaveBeenCalled();
  });
});
