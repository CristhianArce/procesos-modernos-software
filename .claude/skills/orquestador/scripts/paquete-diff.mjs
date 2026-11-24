// Prepara el paquete de revisión del diff para revisor-reglas: una sola lectura en vez de cuatro comandos git.
// Escribe <trabajo>/revision-diff.md con la base, la lista de archivos, el diff y el contenido de los archivos nuevos.
// Excluye .flujo/, .claude/, openspec/ y evidencias/, como pide revisor-reglas.
// Uso: node .claude/skills/orquestador/scripts/paquete-diff.mjs <n> <base> [--trabajo <dir>] [--raiz <raiz>]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";

export const EXCLUIDOS = [".flujo/", ".claude/", "openspec/", "evidencias/"];
const MAX_NUEVO = 200 * 1024;

export const esExcluido = (ruta) => EXCLUIDOS.some((p) => ruta.replace(/\\/g, "/").startsWith(p));

const lineas = (texto) => texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export function armarPaquete({ base, sha, modificados, nuevos, diff, contenidos }) {
  const lista = (titulo, items) => [`## ${titulo}`, "", ...(items.length ? items.map((f) => `- ${f}`) : ["- (ninguno)"]), ""];
  return [
    "# Paquete de revisión del diff",
    "",
    `Base: ${base} (merge-base ${sha}). Excluye ${EXCLUIDOS.join(", ")}.`,
    "",
    ...lista(`Archivos modificados (${modificados.length})`, modificados),
    ...lista(`Archivos nuevos sin seguimiento (${nuevos.length})`, nuevos),
    "## Diff",
    "",
    "```diff",
    diff.trimEnd() || "(sin cambios con seguimiento)",
    "```",
    "",
    ...contenidos.flatMap(({ ruta, texto }) => [`## Archivo nuevo: ${ruta}`, "", "```", texto.trimEnd(), "```", ""]),
  ].join("\n");
}

const git = (raiz, ...args) => execFileSync("git", args, { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });

export function generarPaquete(raiz, base) {
  try { git(raiz, "fetch", "origin"); } catch { /* sin red: se sigue con la base local */ }
  let sha;
  try { sha = git(raiz, "merge-base", `origin/${base}`, "HEAD").trim(); } catch { sha = git(raiz, "merge-base", base, "HEAD").trim(); }
  const modificados = lineas(git(raiz, "diff", "--name-only", sha)).filter((f) => !esExcluido(f));
  const nuevos = lineas(git(raiz, "ls-files", "--others", "--exclude-standard")).filter((f) => !esExcluido(f));
  const diff = modificados.length ? git(raiz, "diff", sha, "--", ...modificados) : "";
  const contenidos = nuevos
    .filter((f) => existsSync(join(raiz, f)) && statSync(join(raiz, f)).size <= MAX_NUEVO)
    .map((ruta) => ({ ruta, texto: readFileSync(join(raiz, ruta), "utf8") }));
  return { markdown: armarPaquete({ base, sha, modificados, nuevos, diff, contenidos }), modificados, nuevos };
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [n, base] = o._;
  if (!n || !base) fallar("Uso: paquete-diff.mjs <n> <base> [--trabajo <dir>] [--raiz <raiz>]", 2);
  const raiz = typeof o.raiz === "string" ? o.raiz : raizRepo();
  const trabajo = typeof o.trabajo === "string" ? o.trabajo : dirTrabajo(n, raiz);
  try {
    const r = generarPaquete(raiz, base);
    mkdirSync(trabajo, { recursive: true });
    const ruta = join(trabajo, "revision-diff.md");
    writeFileSync(ruta, r.markdown);
    console.log(`${ruta}\nModificados: ${r.modificados.length}. Nuevos: ${r.nuevos.length}.`);
  } catch (e) {
    fallar(`No se pudo armar el paquete del diff: ${e.message}`, 2);
  }
}
