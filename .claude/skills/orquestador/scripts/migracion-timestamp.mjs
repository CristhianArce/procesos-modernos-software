// Renombra la migración del change si su versión no es mayor que la última de <base> (Flyway rechaza versiones fuera de orden).
// Uso: node .claude/skills/orquestador/scripts/migracion-timestamp.mjs --raiz <raiz> [--base origin/main | --base-dir <dir>] [--ahora AAAAMMDDHHmm]
// Solo toca migraciones que no existen en <base> (aún no fusionadas), así que no viola la inmutabilidad.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { esPrincipal, fallar, opciones } from "./comun.mjs";

const PATRON = /^V(\d{12})__(.+\.sql)$/;

export const version = (archivo) => archivo.match(PATRON)?.[1] ?? null;

export function marcaDeTiempo(fecha = new Date()) {
  const d = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}${d(fecha.getMonth() + 1)}${d(fecha.getDate())}${d(fecha.getHours())}${d(fecha.getMinutes())}`;
}

const siguiente = (v) => {
  const y = Number(v.slice(0, 4)), mo = Number(v.slice(4, 6)) - 1, d = Number(v.slice(6, 8)), h = Number(v.slice(8, 10)), mi = Number(v.slice(10, 12));
  return marcaDeTiempo(new Date(y, mo, d, h, mi + 1));
};

// Devuelve [{ de, a }] para cada migración nueva cuya versión sea <= la máxima de la base.
export function planRenombres(archivosBase, archivosRama, ahora = marcaDeTiempo()) {
  const enBase = new Set(archivosBase);
  const maxBase = archivosBase.map(version).filter(Boolean).sort().at(-1) ?? "000000000000";
  const nuevas = archivosRama.filter((a) => PATRON.test(a) && !enBase.has(a)).sort();
  let ultima = ahora > maxBase ? null : maxBase;
  const renombres = [];
  for (const a of nuevas) {
    if (version(a) > maxBase) continue;
    const v = ultima === null ? ahora : siguiente(ultima);
    ultima = v;
    renombres.push({ de: a, a: `V${v}__${a.match(PATRON)[2]}` });
  }
  return renombres;
}

function archivosDeRef(raiz, ref) {
  const salida = execSync(`git ls-tree --name-only ${ref} db/migration/`, { cwd: raiz, encoding: "utf8" });
  return salida.split(/\r?\n/).filter(Boolean).map((p) => p.replace(/^db\/migration\//, ""));
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const raiz = o.raiz ?? process.cwd();
  const dir = join(raiz, "db", "migration");
  if (!existsSync(dir)) { console.log("Sin db/migration/: nada que renombrar."); process.exit(0); }
  const base = o["base-dir"] ? readdirSync(o["base-dir"]) : archivosDeRef(raiz, o.base ?? "origin/main");
  const plan = planRenombres(base, readdirSync(dir), o.ahora ?? marcaDeTiempo());
  if (plan.length === 0) { console.log("Las migraciones del change ya son posteriores a la base."); process.exit(0); }
  for (const { de, a } of plan) {
    try {
      execSync(`git mv "db/migration/${de}" "db/migration/${a}"`, { cwd: raiz, stdio: "ignore" });
    } catch {
      renameSync(join(dir, de), join(dir, a));
    }
    console.log(`${de} -> ${a}`);
  }
}
