import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import eslint from "../../eslint.config.mjs";
import vitest from "../../vitest.config.mts";

const paquete = JSON.parse(readFileSync("package.json", "utf8"));
const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8"));

describe("herramientas de calidad", () => {
  it.each(["lint", "typecheck", "test:unit", "test:integration", "build", "seed", "e2e"])(
    "#2 CA-1: existe el script %s que usan el CI y el orquestador",
    (script) => expect(paquete.scripts[script]).toBeTruthy(),
  );

  it("#2 CA-7: TypeScript excluye .claude/ y .flujo/", () => {
    expect(tsconfig.exclude).toEqual(expect.arrayContaining([".claude", ".flujo"]));
  });

  it("#2 CA-7: ESLint ignora .claude/ y .flujo/", () => {
    const ignorados = eslint.flatMap((c: { ignores?: string[] }) => c.ignores ?? []);
    expect(ignorados).toEqual(expect.arrayContaining([".claude/**", ".flujo/**"]));
  });

  it("#2 CA-7: Vitest excluye .claude/ y .flujo/ en cada proyecto", () => {
    const proyectos = vitest.test!.projects as { test: { exclude: string[] } }[];
    for (const p of proyectos) expect(p.test.exclude).toEqual(expect.arrayContaining([".claude/**", ".flujo/**"]));
  });
});
