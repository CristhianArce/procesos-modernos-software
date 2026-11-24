import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AsignarTecnico } from "../ui/AsignarTecnico";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const nodoId = "00000000-0000-4000-8000-000000000001";
const ana = { id: "00000000-0000-4000-8000-0000000000a1", nombreUsuario: "ana" };
const beto = { id: "00000000-0000-4000-8000-0000000000b2", nombreUsuario: "beto" };
const render = (tecnicos: typeof ana[], asignadoId: string | null = null) =>
  renderToStaticMarkup(createElement(AsignarTecnico, { nodoId, tecnicos, asignadoId }));

// El clic, el PUT y el refresco se prueban con Playwright (e2e/mantenimiento.spec.ts).
describe("asignar técnico", () => {
  it("#27 CA-1: muestra el select con label Técnico, la opción vacía y una opción por técnico", () => {
    const html = render([ana, beto]);
    expect(html).toMatch(/<label[^>]*>Técnico<\/label>/);
    expect(html).toContain('data-testid="selector-tecnico"');
    expect(html).toContain("Elige un técnico");
    expect(html).toContain(`value="${ana.id}"`);
    expect(html).toContain(`value="${beto.id}"`);
    expect(html).toMatch(/<button[^>]*>Asignar<\/button>/);
  });

  it("#27 CA-1: preselecciona el técnico asignado", () => {
    const html = render([ana, beto], beto.id);
    expect(html).toMatch(new RegExp(`<option[^>]*value="${beto.id}"[^>]*selected|<option[^>]*selected[^>]*value="${beto.id}"`));
    expect(html).not.toMatch(new RegExp(`<option[^>]*value="${ana.id}"[^>]*selected`));
  });

  it("#27 CA-4: sin técnicos muestra el aviso y no el selector", () => {
    const html = render([]);
    expect(html).toContain("No hay técnicos registrados.");
    expect(html).not.toContain('data-testid="selector-tecnico"');
  });

  it("#27 CA-2: en reposo no hay role=alert", () => {
    expect(render([ana])).not.toContain('role="alert"');
  });
});
