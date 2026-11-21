// Utilidades compartidas por los scripts del orquestador.
import { execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DIR_SCRIPTS = dirname(fileURLToPath(import.meta.url));
export const DIR_PLANTILLAS = resolve(DIR_SCRIPTS, "..", "plantillas");

// Raíz del repo principal (los scripts se invocan siempre desde ella).
export function raizRepo() {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return process.cwd();
  }
}

export const dirTrabajo = (n, raiz = raizRepo()) => join(raiz, ".flujo", `issue-${n}`);

// Opciones --clave valor; devuelve { _: posicionales, clave: valor }.
export function opciones(argv) {
  const r = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) r[argv[i].slice(2)] = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? true : argv[++i];
    else r._.push(argv[i]);
  }
  return r;
}

export const esPrincipal = (url) => process.argv[1] && url === pathToFileURL(resolve(process.argv[1])).href;

export function fallar(mensaje, codigo = 1) {
  console.error(mensaje);
  process.exit(codigo);
}
