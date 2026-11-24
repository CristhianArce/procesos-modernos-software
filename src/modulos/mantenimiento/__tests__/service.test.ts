import { beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "../repo";
import { asignarTecnico, tecnicoAsignado, tecnicosDisponibles } from "../service";

vi.mock("../repo");
vi.mock("@/modulos/nodos/service");

const r = vi.mocked(repo);
const nodos = vi.mocked(obtenerNodo);
const nodoId = "00000000-0000-4000-8000-000000000001";
const tecnicoId = "00000000-0000-4000-8000-0000000000aa";
const tecnico = { id: tecnicoId, nombreUsuario: "tecnico" };

beforeEach(() => {
  vi.resetAllMocks();
  nodos.mockResolvedValue({ id: nodoId } as Awaited<ReturnType<typeof obtenerNodo>>);
});

describe("servicio de mantenimiento", () => {
  it("#27 CA-1: asigna y devuelve el nodo con el técnico", async () => {
    r.buscarUsuario.mockResolvedValue({ ...tecnico, rol: "tecnico" });
    r.asignar.mockResolvedValue(undefined);
    expect(await asignarTecnico(nodoId, tecnicoId)).toEqual({ nodoId, tecnico });
    expect(r.asignar).toHaveBeenCalledWith(nodoId, tecnicoId);
  });

  it("#27 CA-2: un usuario administrador lanza 400 sin asignar", async () => {
    r.buscarUsuario.mockResolvedValue({ id: tecnicoId, nombreUsuario: "admin", rol: "administrador" });
    await expect(asignarTecnico(nodoId, tecnicoId)).rejects.toMatchObject({ estado: 400, message: "El usuario no es técnico" });
    expect(r.asignar).not.toHaveBeenCalled();
  });

  it("#27 CA-2: un usuario inexistente lanza 404 sin asignar", async () => {
    r.buscarUsuario.mockResolvedValue(null);
    await expect(asignarTecnico(nodoId, tecnicoId)).rejects.toMatchObject({ estado: 404, message: "Usuario no encontrado" });
    expect(r.asignar).not.toHaveBeenCalled();
  });

  it("#27 CA-3: un nodo inexistente lanza 404 sin asignar", async () => {
    nodos.mockRejectedValue(Object.assign(new Error("Nodo no encontrado"), { estado: 404 }));
    r.buscarUsuario.mockResolvedValue({ ...tecnico, rol: "tecnico" });
    await expect(asignarTecnico(nodoId, tecnicoId)).rejects.toMatchObject({ estado: 404, message: "Nodo no encontrado" });
    expect(r.asignar).not.toHaveBeenCalled();
  });

  it("#27 CA-1: tecnicoAsignado devuelve lo del repo", async () => {
    r.tecnicoDeNodo.mockResolvedValue(tecnico);
    expect(await tecnicoAsignado(nodoId)).toEqual(tecnico);
    expect(r.tecnicoDeNodo).toHaveBeenCalledWith(nodoId);
    r.tecnicoDeNodo.mockResolvedValue(null);
    expect(await tecnicoAsignado(nodoId)).toBeNull();
  });

  it("#27 CA-1: tecnicosDisponibles devuelve lo del repo", async () => {
    r.listarTecnicos.mockResolvedValue([tecnico]);
    expect(await tecnicosDisponibles()).toEqual([tecnico]);
  });
});
