// Escribe <trabajo>/contexto.md con lo que ya existe en el repo, para que la propuesta no suponga tablas ni módulos.
// Uso: node .claude/skills/orquestador/scripts/contexto.mjs <n> [--raiz <raiz>] [--trabajo <dir>]
// Sin agentes ni BD: lee db/migration/, src/modulos/, db/seed/ y contracts/openapi.yaml.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";

export const PUNTOS_EXTENSION = ["menu.ts", "paneles.ts", "on-alerta.ts", "metrics.ts"];
const listar = (d) => (existsSync(d) ? readdirSync(d).sort() : []);

// Tablas y columnas desde CREATE TABLE y ALTER TABLE … ADD COLUMN, en orden de versión.
export function tablasDeMigraciones(dirMigraciones) {
  const tablas = new Map();
  const tabla = (nombre) => {
    if (!tablas.has(nombre)) tablas.set(nombre, { columnas: [], migraciones: [] });
    return tablas.get(nombre);
  };
  const nombreLimpio = (s) => s.replace(/"/g, "").replace(/^public\./, "");
  for (const archivo of listar(dirMigraciones).filter((a) => a.endsWith(".sql"))) {
    const sql = readFileSync(join(dirMigraciones, archivo), "utf8").replace(/--.*$/gm, "");
    for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(([\s\S]*?)\);/gi)) {
      const t = tabla(nombreLimpio(m[1]));
      t.migraciones.push(archivo);
      for (const parte of m[2].split(/,(?![^(]*\))/)) {
        const col = parte.trim().match(/^"?(\w+)"?\s+\w/);
        if (col && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)$/i.test(col[1])) t.columnas.push(col[1]);
      }
    }
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?([\w."]+)\s+([\s\S]*?);/gi)) {
      const t = tabla(nombreLimpio(m[1]));
      for (const c of m[2].matchAll(/ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi)) {
        if (!/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK)$/i.test(c[1])) t.columnas.push(c[1]);
      }
      if (!t.migraciones.includes(archivo)) t.migraciones.push(archivo);
    }
  }
  return tablas;
}

export function modulosConExtension(dirModulos) {
  return listar(dirModulos)
    .filter((m) => statSync(join(dirModulos, m)).isDirectory())
    .map((m) => ({ modulo: m, puntos: PUNTOS_EXTENSION.filter((p) => existsSync(join(dirModulos, m, p))) }));
}

// Rutas y métodos de contracts/openapi.yaml, leyendo la indentación (sin dependencias).
export function rutasDelContrato(rutaContrato) {
  if (!existsSync(rutaContrato)) return [];
  const rutas = [];
  let enPaths = false;
  let actual = null;
  for (const linea of readFileSync(rutaContrato, "utf8").split(/\r?\n/)) {
    if (/^paths:\s*$/.test(linea)) { enPaths = true; continue; }
    if (enPaths && /^\S/.test(linea)) enPaths = false;
    if (!enPaths) continue;
    const ruta = linea.match(/^ {2}(['"]?)(\/[^'":]*)\1:\s*$/);
    if (ruta) { actual = { ruta: ruta[2], metodos: [] }; rutas.push(actual); continue; }
    const metodo = linea.match(/^ {4}(get|post|put|patch|delete|head|options):/i);
    if (metodo && actual) actual.metodos.push(metodo[1].toUpperCase());
  }
  return rutas;
}

export function generarContexto(raiz) {
  const tablas = tablasDeMigraciones(join(raiz, "db", "migration"));
  const modulos = modulosConExtension(join(raiz, "src", "modulos"));
  const semillas = listar(join(raiz, "db", "seed")).filter((a) => a.endsWith(".sql"));
  const rutas = rutasDelContrato(join(raiz, "contracts", "openapi.yaml"));
  const l = [
    "# Contexto del repositorio",
    "",
    "Generado por `contexto.mjs`. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.",
    "",
    "## Tablas y columnas",
    "",
    "| Tabla | Columnas | Migraciones |",
    "|---|---|---|",
    ...[...tablas].map(([t, v]) => `| ${t} | ${[...new Set(v.columnas)].join(", ")} | ${v.migraciones.join(", ")} |`),
    ...(tablas.size ? [] : ["| (ninguna) | | |"]),
    "",
    "## Módulos y puntos de extensión",
    "",
    "| Módulo | Puntos de extensión |",
    "|---|---|",
    ...modulos.map((m) => `| ${m.modulo} | ${m.puntos.join(", ") || "(ninguno)"} |`),
    ...(modulos.length ? [] : ["| (ninguno) | |"]),
    "",
    "## Semillas",
    "",
    ...(semillas.length ? semillas.map((s) => `- db/seed/${s}`) : ["- (ninguna)"]),
    "",
    "## Rutas del contrato",
    "",
    "| Ruta | Métodos |",
    "|---|---|",
    ...rutas.map((r) => `| ${r.ruta} | ${r.metodos.join(", ")} |`),
    ...(rutas.length ? [] : ["| (ninguna) | |"]),
    "",
  ];
  return l.join("\n");
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const n = o._[0];
  if (!n) fallar("Uso: contexto.mjs <n> [--raiz <raiz>] [--trabajo <dir>]", 2);
  const raiz = o.raiz ?? raizRepo();
  const trabajo = o.trabajo ?? dirTrabajo(n);
  mkdirSync(trabajo, { recursive: true });
  writeFileSync(join(trabajo, "contexto.md"), generarContexto(raiz));
  console.log(join(trabajo, "contexto.md"));
}
