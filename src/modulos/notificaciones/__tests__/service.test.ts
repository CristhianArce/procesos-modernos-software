import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { consultarNotificaciones } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const notificacion = (id: string, creadaEn: string, leida: boolean): repo.Notificacion => ({
  id,
  sensor: "Transformador principal",
  magnitud: "voltaje",
  valor: 131.5,
  creadaEn,
  leida,
});

beforeEach(() => vi.resetAllMocks());

describe("servicio de notificaciones", () => {
  it("#24 CA-1: devuelve noLeidas y las notificaciones en el orden del repo", async () => {
    const lista = [
      notificacion("n3", "2026-11-24T10:00:00.000Z", false),
      notificacion("n2", "2026-11-24T09:00:00.000Z", false),
      notificacion("n1", "2026-11-23T09:00:00.000Z", true),
    ];
    r.recientesDe.mockResolvedValue(lista);
    r.contarNoLeidas.mockResolvedValue(2);
    expect(await consultarNotificaciones("u1")).toEqual({ noLeidas: 2, notificaciones: lista });
  });

  it("#24 CA-1: un técnico sin notificaciones recibe cero y lista vacía", async () => {
    r.recientesDe.mockResolvedValue([]);
    r.contarNoLeidas.mockResolvedValue(0);
    expect(await consultarNotificaciones("u1")).toEqual({ noLeidas: 0, notificaciones: [] });
  });

  it("#24 CA-1: el conteo no se limita a las notificaciones devueltas", async () => {
    r.recientesDe.mockResolvedValue([notificacion("n1", "2026-11-24T10:00:00.000Z", false)]);
    r.contarNoLeidas.mockResolvedValue(55);
    const centro = await consultarNotificaciones("u1");
    expect(centro.noLeidas).toBe(55);
    expect(centro.notificaciones).toHaveLength(1);
  });

  it("#24 CA-2: pide ambos datos solo para el destinatario recibido", async () => {
    r.recientesDe.mockResolvedValue([]);
    r.contarNoLeidas.mockResolvedValue(0);
    await consultarNotificaciones("destinatario-42");
    expect(r.recientesDe).toHaveBeenCalledWith("destinatario-42");
    expect(r.contarNoLeidas).toHaveBeenCalledWith("destinatario-42");
  });
});
