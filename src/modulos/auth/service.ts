import "server-only";
import { ErrorHttp } from "@/lib/errores";
import { firmarSesion, type Rol } from "@/lib/session";
import { hashearContrasena, verificarContrasena } from "./contrasena";
import { limitadorLogin } from "./limitador";
import { buscarPorNombre } from "./repo";
import type { LoginEntrada } from "./schema";

export const MENSAJE_CREDENCIALES = "Credenciales inválidas";

/** 429 con los segundos de espera: el handler los pone en `Retry-After`. */
export class LimiteExcedido extends ErrorHttp {
  constructor(readonly reintentarEnS: number) {
    super(429, "Demasiados intentos fallidos, espera un momento e inténtalo de nuevo");
    this.name = "LimiteExcedido";
  }
}

// Hash calculado una vez: cuando el usuario no existe se verifica contra él para que ambos fallos tarden
// parecido y no se pueda enumerar usuarios por el tiempo de respuesta (design.md, decisión #3).
const hashRelleno = hashearContrasena("relleno-sin-uso");

export type ResultadoLogin = { token: string; usuario: string; rol: Rol };

/** Orden fijo: límite (429), usuario y contraseña (401). El cuerpo ya viene validado por Zod (400). */
export async function iniciarSesion(
  { usuario, contrasena, ip }: LoginEntrada & { ip: string },
  limitador = limitadorLogin,
): Promise<ResultadoLogin> {
  const claves = [`ip:${ip}`, `usuario:${usuario}`];
  const espera = limitador.reintentarEn(claves);
  if (espera !== null) throw new LimiteExcedido(espera);

  const encontrado = await buscarPorNombre(usuario);
  const correcta = await verificarContrasena(contrasena, encontrado?.contrasenaHash ?? (await hashRelleno));
  if (!encontrado || !correcta) {
    limitador.registrarFallo(claves);
    throw new ErrorHttp(401, MENSAJE_CREDENCIALES);
  }
  return { token: await firmarSesion({ sub: encontrado.id, rol: encontrado.rol }), usuario: encontrado.nombreUsuario, rol: encontrado.rol };
}
