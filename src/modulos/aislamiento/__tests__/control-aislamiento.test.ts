import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControlAislamiento } from "../ui/ControlAislamiento";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const id = "00000000-0000-4000-8000-000000000001";
const render = (estado: "conectado" | "desconectado") => renderToStaticMarkup(createElement(ControlAislamiento, { nodoId: id, estado }));

// El clic, la confirmación y el estado nuevo en la ficha se prueban con Playwright (e2e/aislamiento.spec.ts).
describe("control de aislamiento", () => {
  it("#23 CA-1: con el nodo conectado ofrece Aislar nodo y no Reconectar nodo", () => {
    const html = render("conectado");
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Aislar nodo<\/button>/);
    expect(html).not.toContain("Reconectar nodo");
  });

  it("#23 CA-2: con el nodo desconectado ofrece Reconectar nodo y no Aislar nodo", () => {
    const html = render("desconectado");
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Reconectar nodo<\/button>/);
    expect(html).not.toContain("Aislar nodo");
  });

  it.each(["conectado", "desconectado"] as const)("#23 CA-1: en reposo (%s) no pide confirmación ni muestra errores", (estado) => {
    const html = render(estado);
    expect(html).not.toContain("Confirmar");
    expect(html).not.toContain("Cancelar");
    expect(html).not.toContain('role="alert"');
  });
});
