import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contarNoLeidas, insertar, marcarLeida, recientesDe } from "../repo";

const prefijo = `int-marcar-notif-${randomUUID().slice(0, 8)}`;
const base = Date.now() - 24 * 3600 * 1000;
let tecnicoA: string;
let tecnicoB: string;

const crearUsuario = async (sufijo: string) =>
  (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [
      `${prefijo}-${sufijo}`,
    ])
  ).rows[0].id as string;

const nueva = (destinatarioId: string, minuto: number, leida = false) =>
  insertar({
    destinatarioId,
    sensor: `${prefijo}-sensor`,
    magnitud: "voltaje",
    valor: 130 + minuto,
    creadaEn: new Date(base + minuto * 60_000).toISOString(),
    leida,
  });

const idPorValor = async (destinatario: string, valor: number) => (await recientesDe(destinatario)).find((n) => n.valor === valor)!.id;

beforeAll(async () => {
  tecnicoA = await crearUsuario("a");
  tecnicoB = await crearUsuario("b");
  await nueva(tecnicoA, 1);
  await nueva(tecnicoA, 2);
  await nueva(tecnicoA, 3, true);
  await nueva(tecnicoB, 10);
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo marcarLeida", () => {
  it("#53 CA-1: devuelve la notificación con leida true y baja en uno las no leídas", async () => {
    const id = await idPorValor(tecnicoA, 131);
    expect(await contarNoLeidas(tecnicoA)).toBe(2);
    const marcada = await marcarLeida(id, tecnicoA);
    expect(marcada).toMatchObject({ id, sensor: `${prefijo}-sensor`, magnitud: "voltaje", valor: 131, leida: true });
    expect(marcada!.creadaEn).toBe(new Date(base + 60_000).toISOString());
    expect(await contarNoLeidas(tecnicoA)).toBe(1);
    expect(await recientesDe(tecnicoA)).toHaveLength(3);
  });

  it("#53 CA-1: una ya leída devuelve su fila sin cambios", async () => {
    const id = await idPorValor(tecnicoA, 133);
    const antes = await contarNoLeidas(tecnicoA);
    const marcada = await marcarLeida(id, tecnicoA);
    expect(marcada).toMatchObject({ id, valor: 133, leida: true });
    expect(await contarNoLeidas(tecnicoA)).toBe(antes);
  });

  it("#53 CA-2: con el destinatario de otro técnico devuelve null y la fila sigue sin leer", async () => {
    const id = await idPorValor(tecnicoB, 140);
    expect(await marcarLeida(id, tecnicoA)).toBeNull();
    const deB = await recientesDe(tecnicoB);
    expect(deB.find((n) => n.id === id)?.leida).toBe(false);
    expect(await contarNoLeidas(tecnicoB)).toBe(1);
  });

  it("#53 CA-2: un UUID que no existe devuelve null", async () => {
    expect(await marcarLeida(randomUUID(), tecnicoA)).toBeNull();
  });
});
