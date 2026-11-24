import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { consultar } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const usuarioId = "00000000-0000-4000-8000-000000000099";

beforeEach(() => vi.resetAllMocks());

describe("servicio de notificaciones", () => {
  it("#24 CA-1: devuelve notificaciones y noLeidas", async () => {
    const respuesta = {
      notificaciones: [
        { id: "n2", sensor: "Sensor de tensión S1", magnitud: "voltaje" as const, valor: 128.9, fecha: "2026-11-22T10:00:00.000Z", leida: false },
        { id: "n1", sensor: "Sensor de corriente S2", magnitud: "corriente" as const, valor: 17.2, fecha: "2026-11-22T09:00:00.000Z", leida: true },
      ],
      noLeidas: 1,
    };
    r.listarDeUsuario.mockResolvedValue(respuesta);
    expect(await consultar(usuarioId)).toEqual(respuesta);
  });

  it("#24 CA-1: un técnico sin notificaciones recibe lista vacía y 0 no leídas", async () => {
    r.listarDeUsuario.mockResolvedValue({ notificaciones: [], noLeidas: 0 });
    expect(await consultar(usuarioId)).toEqual({ notificaciones: [], noLeidas: 0 });
  });

  it("#24 CA-2: pasa al repo solo el usuario recibido", async () => {
    r.listarDeUsuario.mockResolvedValue({ notificaciones: [], noLeidas: 0 });
    await consultar(usuarioId);
    expect(r.listarDeUsuario).toHaveBeenCalledTimes(1);
    expect(r.listarDeUsuario).toHaveBeenCalledWith(usuarioId);
  });
});
