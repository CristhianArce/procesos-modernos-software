// Utilidades compartidas por las pruebas de la configuración de IA (node --test).
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const leer = (ruta) => readFileSync(join(RAIZ, ruta), "utf8");

// El paquete `yaml` llega con OpenSpec instalado globalmente (no hay package.json en la HU 1a).
let yamlCache;
export function cargarYaml() {
  if (yamlCache) return yamlCache;
  const raizGlobal = execSync("npm root -g", { encoding: "utf8" }).trim();
  const base = join(raizGlobal, "@fission-ai", "openspec", "package.json");
  if (!existsSync(base)) {
    throw new Error("Falta OpenSpec global: npm i -g @fission-ai/openspec@2.1");
  }
  yamlCache = createRequire(base)("yaml");
  return yamlCache;
}

// Frontmatter YAML entre las dos primeras líneas '---' de un .md.
export function frontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return cargarYaml().parse(m[1]);
}
