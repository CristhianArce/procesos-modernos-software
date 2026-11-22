import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PaginaLogin from "@/app/login/page";

// useRouter exige el router de Next montado; en el render a HTML se reemplaza por uno vacío.
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

// Vitest solo incluye *.test.ts, por eso createElement. El envío del formulario y la navegación
// al tablero se prueban con Playwright (e2e/login.spec.ts).
describe("página /login", () => {
  const html = renderToStaticMarkup(createElement(PaginaLogin));

  it("#20 CA-1: muestra un formulario con los campos usuario y contraseña", () => {
    expect(html).toContain("<form");
    expect(html).toMatch(/<input[^>]*name="usuario"[^>]*>/);
    expect(html).toMatch(/<input[^>]*name="contrasena"[^>]*type="password"[^>]*>|<input[^>]*type="password"[^>]*name="contrasena"[^>]*>/);
  });

  it("#20 CA-1: ofrece un botón para iniciar sesión y no muestra errores de entrada", () => {
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Iniciar sesión<\/button>/);
    expect(html).not.toContain('role="alert"');
  });
});
