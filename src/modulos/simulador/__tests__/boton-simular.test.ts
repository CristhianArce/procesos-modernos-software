import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BotonSimular } from "../ui/BotonSimular";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// El clic y la lectura nueva en la ficha se prueban con Playwright (e2e/nodos.spec.ts).
describe("botón del simulador", () => {
  it("#21 CA-6: muestra el botón para simular lecturas, sin errores de entrada", () => {
    const html = renderToStaticMarkup(createElement(BotonSimular, { nodoId: "00000000-0000-4000-8000-000000000001" }));
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Simular lecturas<\/button>/);
    expect(html).not.toContain('role="alert"');
  });
});
