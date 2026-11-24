// Escribe <trabajo>/contexto.md con lo que ya existe en el repo, para que la propuesta no suponga tablas ni módulos.
// Uso: node .claude/skills/orquestador/scripts/contexto.mjs <n> [--raiz <raiz>] [--trabajo <dir>]
// Sin agentes ni BD: lee openspec/specs/, openspec/changes/, db/migration/, src/modulos/, db/seed/ y contracts/openapi.yaml.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";
import { registrarCierre } from "./tiempos.mjs";

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

// Capacidades ya especificadas en openspec/specs/<cap>/spec.md: su Purpose y sus requisitos (fuente de verdad del comportamiento).
export function capacidadesEspecificadas(dirSpecs) {
  return listar(dirSpecs)
    .filter((c) => existsSync(join(dirSpecs, c, "spec.md")))
    .map((c) => {
      const texto = readFileSync(join(dirSpecs, c, "spec.md"), "utf8");
      const proposito = (texto.split(/^## Purpose\s*$/m)[1] ?? "").split(/^##\s/m)[0].trim().split(/\r?\n\r?\n/)[0].replace(/\s+/g, " ");
      const requisitos = [...texto.matchAll(/^### Requirement:\s*(.+)$/gm)].map((m) => m[1].trim());
      return { capacidad: c, proposito, requisitos };
    });
}

// Changes de OpenSpec en curso (sin archivar): otra historia puede estar tocando lo mismo.
export const changesActivos = (dirChanges) =>
  listar(dirChanges).filter((c) => c !== "archive" && statSync(join(dirChanges, c)).isDirectory());

export function generarContexto(raiz) {
  const tablas = tablasDeMigraciones(join(raiz, "db", "migration"));
  const modulos = modulosConExtension(join(raiz, "src", "modulos"));
  const semillas = listar(join(raiz, "db", "seed")).filter((a) => a.endsWith(".sql"));
  const rutas = rutasDelContrato(join(raiz, "contracts", "openapi.yaml"));
  const capacidades = capacidadesEspecificadas(join(raiz, "openspec", "specs"));
  const changes = changesActivos(join(raiz, "openspec", "changes"));
  const l = [
    "# Contexto del repositorio",
    "",
    "Generado por `contexto.mjs`. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.",
    "",
    "## Capacidades especificadas",
    "",
    "Comportamiento ya especificado en `openspec/specs/`. Si la historia cambia una de estas capacidades, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito; no se crea otra capacidad para lo mismo.",
    "",
    "| Capacidad | Propósito | Requisitos |",
    "|---|---|---|",
    ...capacidades.map((c) => `| ${c.capacidad} | ${c.proposito || "(sin Purpose)"} | ${c.requisitos.join("; ") || "(ninguno)"} |`),
    ...(capacidades.length ? [] : ["| (ninguna) | | |"]),
    "",
    "## Changes activos",
    "",
    ...(changes.length ? changes.map((c) => `- openspec/changes/${c}/`) : ["- (ninguno)"]),
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
  // Cierra el paso 2 en tiempos.md (si la corrida se está midiendo): el orquestador no necesita otra llamada.
  registrarCierre(join(trabajo, "tiempos.md"), 2);
  console.log(join(trabajo, "contexto.md"));
}
