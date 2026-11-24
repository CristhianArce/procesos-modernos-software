import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatearFecha } from "@/modulos/dashboard/formato";
import { ListaNotificaciones } from "../ui/ListaNotificaciones";
import type { Notificacion } from "../repo";

const reciente: Notificacion = {
  id: "n2",
  sensor: "Sensor de tensión",
  magnitud: "voltaje",
  valor: 130,
  creadaEn: "2026-11-22T15:30:05.000Z",
  leida: false,
};
const antigua: Notificacion = {
  id: "n1",
  sensor: "Medidor de planta",
  magnitud: "corriente",
  valor: 9.8,
  creadaEn: "2026-11-21T15:30:05.000Z",
  leida: true,
};
const potente: Notificacion = {
  id: "n0",
  sensor: "Transformador principal",
  magnitud: "potencia",
  valor: 1250,
  creadaEn: "2026-11-20T15:30:05.000Z",
  leida: true,
};

const html = (noLeidas: number, notificaciones: Notificacion[]) =>
  renderToStaticMarkup(createElement(ListaNotificaciones, { noLeidas, notificaciones }));

const items = (marcado: string) => marcado.split('data-testid="notificacion"').slice(1);

describe("ListaNotificaciones", () => {
  it("#24 CA-1: muestra el contador de no leídas", () => {
    const marcado = html(3, [reciente, antigua]);
    const bloque = marcado.split('data-testid="no-leidas"')[1];
    expect(bloque).toBeDefined();
    expect(bloque.slice(0, 120)).toContain("3 sin leer");
  });

  it("#24 CA-1: una notificación por elemento, en el orden recibido", () => {
    const filas = items(html(1, [reciente, antigua, potente]));
    expect(filas).toHaveLength(3);
    expect(filas[0]).toContain("Sensor de tensión");
    expect(filas[1]).toContain("Medidor de planta");
    expect(filas[2]).toContain("Transformador principal");
  });

  it("#24 CA-1: cada fila trae magnitud, valor con unidad, fecha y estado", () => {
    const filas = items(html(1, [reciente, antigua, potente]));
    expect(filas[0]).toContain("voltaje");
    expect(filas[0]).toContain("130 V");
    expect(filas[0]).toContain(formatearFecha(reciente.creadaEn));
    expect(filas[0]).toContain("Sin leer");
    expect(filas[1]).toContain("corriente");
    expect(filas[1]).toContain("9,8 A");
    expect(filas[1]).toContain("Leída");
    expect(filas[2]).toContain("potencia");
    expect(filas[2]).toContain("1.250 W");
  });

  it("#24 CA-1: el valor lleva la clase .cifra", () => {
    const filas = items(html(1, [reciente]));
    expect(filas[0]).toMatch(/class="[^"]*\bcifra\b[^"]*"[^>]*>[^<]*130 V/);
  });

  it("#24 CA-1: con la lista vacía muestra el estado vacío y 0 sin leer", () => {
    const marcado = html(0, []);
    expect(marcado).toContain('data-testid="sin-notificaciones"');
    expect(marcado).toContain("No tienes notificaciones");
    expect(marcado).toContain("Cuando una alerta te avise, aparecerá aquí.");
    expect(marcado.split('data-testid="no-leidas"')[1].slice(0, 120)).toContain("0 sin leer");
    expect(items(marcado)).toHaveLength(0);
  });

  it("#24 CA-1: con notificaciones no muestra el estado vacío", () => {
    const marcado = html(1, [reciente]);
    expect(items(marcado)).toHaveLength(1);
    expect(marcado).not.toContain('data-testid="sin-notificaciones"');
  });
});
