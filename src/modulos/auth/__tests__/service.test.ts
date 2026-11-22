import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorHttp } from "@/lib/errores";
import { verificarSesion } from "@/lib/session";
import { hashearContrasena, verificarContrasena } from "../contrasena";
import { crearLimitador } from "../limitador";
import { buscarPorNombre } from "../repo";
import { iniciarSesion, LimiteExcedido } from "../service";

vi.mock("../repo");
vi.mock("../contrasena", async (original) => {
  const real = await original<typeof import("../contrasena")>();
  return { ...real, verificarContrasena: vi.fn(real.verificarContrasena) };
});

const buscar = vi.mocked(buscarPorNombre);
const verificar = vi.mocked(verificarContrasena);
let usuarioAna: Awaited<ReturnType<typeof buscarPorNombre>>;

beforeAll(async () => {
  process.env.SESSION_SECRET = "x".repeat(32);
  usuarioAna = { id: "id-ana", nombreUsuario: "ana", contrasenaHash: await hashearContrasena("clave-de-ana"), rol: "administrador" };
});

beforeEach(() => {
  buscar.mockReset();
  buscar.mockImplementation(async (nombre) => (nombre === "ana" ? usuarioAna : null));
  verificar.mockClear();
});

const entrada = (usuario: string, contrasena: string, ip = "1.1.1.1") => ({ usuario, contrasena, ip });

describe("iniciarSesion", () => {
  it("#20 CA-1: con credenciales correctas devuelve un token con el id y el rol del usuario", async () => {
    const resultado = await iniciarSesion(entrada("ana", "clave-de-ana"), crearLimitador());
    expect(resultado).toMatchObject({ usuario: "ana", rol: "administrador" });
    expect(await verificarSesion(resultado.token)).toEqual({ sub: "id-ana", rol: "administrador" });
  });

  it("#20 CA-2: una contraseña incorrecta lanza 401 con el mensaje único", async () => {
    const error = await iniciarSesion(entrada("ana", "mala"), crearLimitador()).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorHttp);
    expect(error).toMatchObject({ estado: 401, message: "Credenciales inválidas" });
  });

  it("#20 CA-2: un usuario inexistente lanza el mismo 401 y verifica contra el hash de relleno", async () => {
    const error = await iniciarSesion(entrada("nadie", "cualquiera"), crearLimitador()).catch((e) => e);
    expect(error).toMatchObject({ estado: 401, message: "Credenciales inválidas" });
    expect(verificar).toHaveBeenCalledTimes(1);
    expect(verificar.mock.calls[0][0]).toBe("cualquiera");
  });

  it("#20 CA-4: tras 5 fallos desde la misma IP el siguiente intento lanza 429 sin consultar el repo", async () => {
    const limitador = crearLimitador();
    for (let i = 0; i < 5; i++) await iniciarSesion(entrada(`nadie-${i}`, "x"), limitador).catch(() => undefined);
    buscar.mockClear();
    const error = await iniciarSesion(entrada("ana", "clave-de-ana"), limitador).catch((e) => e);
    expect(error).toBeInstanceOf(LimiteExcedido);
    expect(error).toMatchObject({ estado: 429 });
    expect(error.reintentarEnS).toBeGreaterThan(0);
    expect(buscar).not.toHaveBeenCalled();
  });

  it("#20 CA-4: 5 fallos contra el mismo usuario bloquean aunque vengan de IP distintas y la clave sea correcta", async () => {
    const limitador = crearLimitador();
    for (let i = 0; i < 5; i++) await iniciarSesion(entrada("ana", "mala", `9.9.9.${i}`), limitador).catch(() => undefined);
    const error = await iniciarSesion(entrada("ana", "clave-de-ana", "8.8.8.8"), limitador).catch((e) => e);
    expect(error).toBeInstanceOf(LimiteExcedido);
  });

  it("#20 CA-4: los aciertos no cuentan como fallos", async () => {
    const limitador = crearLimitador();
    for (let i = 0; i < 7; i++) await expect(iniciarSesion(entrada("ana", "clave-de-ana"), limitador)).resolves.toBeDefined();
  });
});
