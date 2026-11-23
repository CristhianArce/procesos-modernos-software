import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Criterio 6 del rediseño SCADA: con prefers-reduced-motion no hay animaciones de flujo ni parpadeos.
const css = readFileSync("src/app/globals.css", "utf8");

/** Contenido de cada bloque @media (prefers-reduced-motion: reduce) { … }, con sus llaves anidadas. */
function bloquesReducidos(texto: string): string[] {
  const bloques: string[] = [];
  let i = texto.indexOf("@media (prefers-reduced-motion: reduce)");
  while (i >= 0) {
    let j = texto.indexOf("{", i) + 1;
    const inicio = j;
    for (let nivel = 1; nivel > 0; j++) nivel += texto[j] === "{" ? 1 : texto[j] === "}" ? -1 : 0;
    bloques.push(texto.slice(inicio, j - 1));
    i = texto.indexOf("@media (prefers-reduced-motion: reduce)", j);
  }
  return bloques;
}

/** Clases que declaran una animación fuera de los bloques de movimiento reducido. */
const animadas = () => {
  const sinReducidos = bloquesReducidos(css).reduce((t, b) => t.replace(b, ""), css);
  return [...sinReducidos.matchAll(/([^{}]+)\{[^{}]*\banimation:/g)].map((m) => m[1].trim());
};

describe("movimiento reducido", () => {
  const reducido = bloquesReducidos(css).join("\n");

  it("ui-scada: CA-6 anula el flujo de energía y el parpadeo de los nodos", () => {
    expect(reducido).toMatch(/\.mimico-flujo[\s\S]*?animation: none/);
    expect(reducido).toMatch(/\.mimico-nodo\[data-parpadeo\] \.mimico-simbolo[\s\S]*?animation: none/);
  });

  it("ui-scada: CA-6 cada clase animada del tema tiene su anulación con movimiento reducido", () => {
    const clases = animadas().flatMap((s) => s.match(/\.[a-z-]+/g) ?? []);
    expect(clases.length).toBeGreaterThan(0);
    for (const c of new Set(clases)) expect(reducido, `falta anular ${c}`).toContain(c);
  });

  it("ui-scada: CA-6 además frena cualquier otra animación o transición (las de Tailwind incluidas)", () => {
    expect(reducido).toMatch(/animation-duration: 0\.01ms !important/);
    expect(reducido).toMatch(/transition-duration: 0\.01ms !important/);
  });
});
