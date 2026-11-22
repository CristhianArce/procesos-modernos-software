import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FormularioNodo } from "../ui/FormularioNodo";

// useRouter exige el router de Next montado; en el render a HTML se reemplaza por uno vacío.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// El envío y la lista actualizada se prueban con Playwright (e2e/nodos.spec.ts).
describe("formulario de nodo", () => {
  const html = renderToStaticMarkup(createElement(FormularioNodo));

  it("#21 CA-1: muestra los campos nombre y ubicación y el botón para crear", () => {
    expect(html).toMatch(/<input[^>]*name="nombre"[^>]*>/);
    expect(html).toMatch(/<input[^>]*name="ubicacion"[^>]*>/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Crear nodo<\/button>/);
  });

  it("#21 CA-3: exige el nombre, limita su longitud y no muestra errores de entrada", () => {
    const nombre = html.match(/<input[^>]*name="nombre"[^>]*>/)?.[0] ?? "";
    expect(nombre).toContain("required");
    expect(nombre).toContain('maxLength="80"');
    expect(html).not.toContain('role="alert"');
  });
});
