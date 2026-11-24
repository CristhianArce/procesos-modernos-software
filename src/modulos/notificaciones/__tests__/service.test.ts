import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import type { RespuestaNotificaciones } from "../schema";
import { consultar } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const respuesta: RespuestaNotificaciones = {
  notificaciones: [{ id: "n1", sensor: "S1", magnitud: "voltaje", valor: 130, fecha: "2026-11-23T10:00:00.000Z", leida: false }],
  noLeidas: 1,
};

beforeEach(() => vi.resetAllMocks());

describe("servicio de notificaciones", () => {
  it("#24 CA-1: devuelve notificaciones y noLeidas", async () => {
    r.listarDeUsuario.mockResolvedValue(respuesta);
    expect(await consultar("u1")).toEqual(respuesta);
  });

  it("#24 CA-2: pasa al repo solo el usuario recibido", async () => {
    r.listarDeUsuario.mockResolvedValue({ notificaciones: [], noLeidas: 0 });
    await consultar("u1");
    expect(r.listarDeUsuario).toHaveBeenCalledTimes(1);
    expect(r.listarDeUsuario).toHaveBeenCalledWith("u1");
  });
});
