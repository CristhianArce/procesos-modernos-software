import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ListaNotificaciones } from "../ui/ListaNotificaciones";
import type { Notificacion } from "../repo";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const sinLeer = (id: string): Notificacion => ({
  id,
  sensor: "Sensor de tensión",
  magnitud: "voltaje",
  valor: 130,
  creadaEn: "2026-11-22T15:30:05.000Z",
  leida: false,
});
const leida = (id: string): Notificacion => ({ ...sinLeer(id), sensor: "Medidor de planta", leida: true });

const items = (marcado: string) => marcado.split('data-testid="notificacion"').slice(1);
const html = (noLeidas: number, notificaciones: Notificacion[]) =>
  renderToStaticMarkup(createElement(ListaNotificaciones, { noLeidas, notificaciones }));

describe("ListaNotificaciones con botón de marcar", () => {
  it("#53 CA-1: cada fila Sin leer trae el botón y cada fila Leída ninguno", () => {
    const filas = items(html(2, [sinLeer("a"), leida("b"), sinLeer("c")]));
    expect(filas).toHaveLength(3);
    expect(filas[0]).toContain("Sin leer");
    expect(filas[0]).toContain('data-testid="marcar-leida"');
    expect(filas[1]).toContain("Leída");
    expect(filas[1]).not.toContain('data-testid="marcar-leida"');
    expect(filas[2]).toContain('data-testid="marcar-leida"');
  });

  it("#53 CA-1: conserva el contador y la insignia con texto", () => {
    const marcado = html(1, [sinLeer("a"), leida("b")]);
    expect(marcado.split('data-testid="no-leidas"')[1].slice(0, 120)).toContain("1 sin leer");
    expect(marcado).toContain("Sin leer");
    expect(marcado).toContain("Leída");
  });

  it("#53 CA-1: una lista solo de leídas no muestra ningún botón", () => {
    const marcado = html(0, [leida("b")]);
    expect(items(marcado)).toHaveLength(1);
    expect(marcado).not.toContain('data-testid="marcar-leida"');
  });
});
