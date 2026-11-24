import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contarNoLeidas, insertar, LIMITE_NOTIFICACIONES, recientesDe } from "../repo";

const prefijo = `int-repo-notif-${randomUUID().slice(0, 8)}`;
const base = Date.now() - 24 * 3600 * 1000;
let tecnicoA: string;
let tecnicoB: string;
let sinNada: string;

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

beforeAll(async () => {
  tecnicoA = await crearUsuario("a");
  tecnicoB = await crearUsuario("b");
  sinNada = await crearUsuario("vacio");
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de notificaciones", () => {
  it("#24 CA-1: un destinatario sin notificaciones tiene lista vacía y cero sin leer", async () => {
    expect(await recientesDe(sinNada)).toEqual([]);
    expect(await contarNoLeidas(sinNada)).toBe(0);
  });

  it("#24 CA-1: recientesDe devuelve de la más reciente a la más antigua con todos sus campos", async () => {
    await nueva(tecnicoA, 1, true);
    await nueva(tecnicoA, 3);
    await nueva(tecnicoA, 2);
    const lista = await recientesDe(tecnicoA);
    expect(lista.map((n) => n.valor)).toEqual([133, 132, 131]);
    expect(lista[0]).toMatchObject({ sensor: `${prefijo}-sensor`, magnitud: "voltaje", leida: false });
    expect(lista[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(lista[0].creadaEn).toBe(new Date(base + 3 * 60_000).toISOString());
    expect(lista[2].leida).toBe(true);
    expect(await contarNoLeidas(tecnicoA)).toBe(2);
  });

  it("#24 CA-2: no incluye ni cuenta las notificaciones de otro destinatario", async () => {
    await nueva(tecnicoB, 10);
    const deB = await recientesDe(tecnicoB);
    expect(deB).toHaveLength(1);
    expect(deB[0].valor).toBe(140);
    expect(await contarNoLeidas(tecnicoB)).toBe(1);
    const deA = await recientesDe(tecnicoA);
    expect(deA.map((n) => n.valor)).not.toContain(140);
    expect(await contarNoLeidas(tecnicoA)).toBe(2);
  });

  it("#24 CA-1: con 60 notificaciones devuelve las 50 más recientes y cuenta las 55 sin leer", async () => {
    const id = await crearUsuario("muchas");
    for (let i = 0; i < 60; i++) await nueva(id, i, i < 5);
    const lista = await recientesDe(id);
    expect(LIMITE_NOTIFICACIONES).toBe(50);
    expect(lista).toHaveLength(50);
    expect(lista[0].valor).toBe(130 + 59);
    expect(lista[49].valor).toBe(130 + 10);
    expect(await contarNoLeidas(id)).toBe(55);
  });
});
