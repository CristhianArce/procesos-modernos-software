import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { consultarNotificaciones } from "../service";
import type { Notificacion } from "../tipos";

vi.mock("../repo");

const r = vi.mocked(repo);

const notificacion = (id: string, extra: Partial<Notificacion> = {}): Notificacion => ({
  id,
  sensor: "Sensor de prueba",
  magnitud: "voltaje",
  valor: 130,
  fecha: "2026-11-22T15:00:00.000Z",
  leida: false,
  ...extra,
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("consultarNotificaciones", () => {
  it("#24 CA-1: pide al repo 50 y devuelve la lista con el número de no leídas", async () => {
    const lista = [notificacion("n2"), notificacion("n1", { leida: true })];
    r.listarDeUsuario.mockResolvedValue(lista);
    r.contarNoLeidas.mockResolvedValue(55);

    const centro = await consultarNotificaciones("u1");

    expect(r.listarDeUsuario).toHaveBeenCalledWith("u1", 50);
    expect(r.contarNoLeidas).toHaveBeenCalledWith("u1");
    expect(centro).toEqual({ notificaciones: lista, noLeidas: 55 });
  });

  it("#24 CA-1: sin notificaciones devuelve lista vacía y 0", async () => {
    r.listarDeUsuario.mockResolvedValue([]);
    r.contarNoLeidas.mockResolvedValue(0);

    expect(await consultarNotificaciones("u1")).toEqual({ notificaciones: [], noLeidas: 0 });
  });
});
