// Commitea y sube los archivos de la historia en una sola llamada: verifica el build (como puede-commitear),
// agrega solo las rutas explícitas, commitea con el issue y el change, y hace push de la rama.
// Uso: node .claude/skills/orquestador/scripts/commitear.mjs <n> --rama <rama> --mensaje "<tipo>: <descripción> (#<n>)"
//        --change <change> [--porque "<texto>"] [--trabajo <dir>] <ruta>...
// Salida: el sha corto del commit. Código 1 si no se puede commitear (motivo en la salida), 2 por uso incorrecto.
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";
import { evaluar } from "./puede-commitear.mjs";

const PROHIBIDAS = [".flujo/", ".claude/", "node_modules/", ".env"];

/** Motivo por el que las rutas no sirven, o null. Solo archivos explícitos: nunca carpetas, `.`, opciones ni secretos. */
export function motivoRutaInvalida(rutas, esCarpeta = () => false) {
  if (rutas.length === 0) return "No hay rutas para commitear";
  for (const r of rutas) {
    const limpia = r.replace(/\\/g, "/").replace(/^\.\//, "");
    if (limpia.startsWith("-") || limpia === "." || limpia === "") return `Ruta no válida: "${r}" (se commitean solo archivos explícitos)`;
    if (PROHIBIDAS.some((p) => limpia === p.replace(/\/$/, "") || limpia.startsWith(p) || limpia.split("/").includes(".env"))) return `Ruta prohibida: "${r}" (.flujo/, .claude/, node_modules/ y .env no se commitean)`;
    if (esCarpeta(r)) return `"${r}" es una carpeta: pasa la ruta de cada archivo`;
  }
  return null;
}

export const ramaValida = (rama) => /^feature\/issue-\d+-[\w-]+$/.test(rama ?? "");

/** Argumentos de `git commit`: título, porqué (opcional) y la línea del change. Sin atribuciones. */
export function argumentosCommit({ mensaje, porque, change }) {
  return ["commit", "-m", mensaje, ...(porque ? ["-m", porque] : []), "-m", `Change: ${change}`];
}

const git = (...a) => execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [n, ...rutas] = o._;
  const uso = 'Uso: commitear.mjs <n> --rama <rama> --mensaje "<tipo>: <descripción> (#<n>)" --change <change> [--porque "<texto>"] <ruta>...';
  if (!n || typeof o.rama !== "string" || typeof o.mensaje !== "string" || typeof o.change !== "string") fallar(uso, 2);
  if (!ramaValida(o.rama)) fallar(`Rama no válida: "${o.rama}" (debe ser feature/issue-<n>-<slug>)`, 2);
  if (!o.mensaje.includes(`#${n}`)) fallar(`El mensaje debe citar el issue (#${n})`, 2);
  const raiz = o.raiz ?? raizRepo();
  const motivo = motivoRutaInvalida(rutas, (r) => existsSync(join(raiz, r)) && statSync(join(raiz, r)).isDirectory());
  if (motivo) fallar(`NO COMMITEAR: ${motivo}`, 1);
  const d = evaluar({ n, rutas, raiz, trabajo: o.trabajo });
  if (!d.puede) fallar(`NO COMMITEAR: ${d.motivo}`, 1);
  try {
    git("add", ...rutas);
    git(...argumentosCommit({ mensaje: o.mensaje, porque: typeof o.porque === "string" ? o.porque : undefined, change: o.change }));
    const sha = git("rev-parse", "--short", "HEAD");
    git("push", "-u", "origin", o.rama);
    console.log(`COMMIT ${sha} en ${o.rama} (push hecho)`);
  } catch (e) {
    fallar(`Falló git: ${(e.stderr || e.message).toString().trim()}`, 1);
  }
}
