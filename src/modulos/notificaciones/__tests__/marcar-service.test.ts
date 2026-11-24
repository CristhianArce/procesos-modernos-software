import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import * as repo from "../repo";
import { marcarComoLeida, NOTIFICACION_NO_ENCONTRADA } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const notificacion: repo.Notificacion = {
  id: "n1",
  sensor: "Transformador principal",
  magnitud: "voltaje",
  valor: 131.5,
  creadaEn: "2026-11-24T10:00:00.000Z",
  leida: true,
};

beforeEach(() => vi.resetAllMocks());

describe("servicio marcarComoLeida", () => {
  it("#53 CA-1: pasa el id y el destinatario al repo y devuelve su notificación", async () => {
    r.marcarLeida.mockResolvedValue(notificacion);
    expect(await marcarComoLeida("n1", "u1")).toEqual(notificacion);
    expect(r.marcarLeida).toHaveBeenCalledWith("n1", "u1");
  });

  it("#53 CA-2: si el repo devuelve null lanza ErrorHttp 404 con el mensaje", async () => {
    r.marcarLeida.mockResolvedValue(null);
    const error = await marcarComoLeida("n1", "u2").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorHttp);
    expect((error as ErrorHttp).estado).toBe(404);
    expect((error as ErrorHttp).message).toBe("Notificación no encontrada");
    expect(NOTIFICACION_NO_ENCONTRADA).toBe("Notificación no encontrada");
  });
});
