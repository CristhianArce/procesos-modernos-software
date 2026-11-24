import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "../repo";
import { agregarAfectado, listarAfectados } from "../service";

vi.mock("../repo");
vi.mock("@/modulos/nodos/service");

const r = vi.mocked(repo);
const nodo = vi.mocked(obtenerNodo);

const nodoId = "00000000-0000-4000-8000-000000000001";
const afectado: repo.Afectado = {
  id: "00000000-0000-4000-8000-000000000201",
  nodoId,
  alias: "Usuario demo 01",
  creadoEn: "2026-11-24T00:00:00.000Z",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("servicio de afectados", () => {
  it("#54 CA-1: agregarAfectado devuelve lo que crea el repo", async () => {
    r.crear.mockResolvedValue(afectado);
    expect(await agregarAfectado({ nodoId, alias: "Usuario demo 01" })).toEqual(afectado);
    expect(nodo).toHaveBeenCalledWith(nodoId);
    expect(r.crear).toHaveBeenCalledWith({ nodoId, alias: "Usuario demo 01" });
  });

  it("#54 CA-3: si el nodo no existe lanza 404 y no llama a repo.crear", async () => {
    nodo.mockRejectedValue(new ErrorHttp(404, "Nodo no encontrado"));
    await expect(agregarAfectado({ nodoId, alias: "Usuario demo 01" })).rejects.toMatchObject({
      estado: 404,
      message: "Nodo no encontrado",
    });
    expect(r.crear).not.toHaveBeenCalled();
  });

  it("#54 CA-1: listarAfectados devuelve la lista del repo", async () => {
    r.listarPorNodo.mockResolvedValue([afectado]);
    expect(await listarAfectados(nodoId)).toEqual([afectado]);
    expect(r.listarPorNodo).toHaveBeenCalledWith(nodoId);
  });
});
