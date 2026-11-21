// Busca cada CA-n de issue.md en las specs y tareas de un change (apoyo para G2).
// Uso: node .claude/skills/orquestador/scripts/trazabilidad-grep.mjs <issue.md> <dir-del-change> [--salida <trabajo>/trazabilidad.md]
// Salida: JSON { criterios: { "CA-1": { requisitos, escenarios, tareas } }, sinCobertura, tareasSinCriterio,
//   bloquesSinCriterio, criteriosInexistentes, tareasSinNumero }. Con --salida, además escribe la tabla en Markdown.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { esPrincipal, fallar, opciones } from "./comun.mjs";

export function criteriosDelIssue(textoIssue) {
  const ids = new Set();
  const seccion = textoIssue.split(/^## Criterios numerados\s*$/m)[1] ?? textoIssue;
  for (const m of seccion.matchAll(/\bCA-(\d+)\b/g)) ids.add(`CA-${m[1]}`);
  return [...ids].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
}

const citas = (texto) => new Set([...texto.matchAll(/\bCA-(\d+)\b/g)].map((m) => `CA-${m[1]}`));
const DERIVADO = /Derivado: decisión #\d+/;

// Recorre un spec.md y devuelve [{ tipo: requisito|escenario, nombre, criterios, derivado }].
export function bloquesDeSpec(texto) {
  const bloques = [];
  let actual = null;
  for (const linea of texto.split(/\r?\n/)) {
    const req = linea.match(/^### Requirement:\s*(.+)$/);
    const esc = linea.match(/^#### Scenario:\s*(.+)$/);
    if (req || esc || /^##\s/.test(linea)) {
      if (actual) bloques.push(actual);
      actual = req ? { tipo: "requisito", nombre: req[1].trim(), texto: "" } : esc ? { tipo: "escenario", nombre: esc[1].trim(), texto: "" } : null;
      if (actual) actual.texto = linea;
      continue;
    }
    if (actual) actual.texto += `\n${linea}`;
  }
  if (actual) bloques.push(actual);
  return bloques.map(({ tipo, nombre, texto }) => ({ tipo, nombre, criterios: citas(texto), derivado: DERIVADO.test(texto) }));
}

function specsDe(dirChange) {
  const dir = join(dirChange, "specs");
  const r = [];
  const recorrer = (d) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) recorrer(p);
      else if (e.endsWith(".md")) r.push(p);
    }
  };
  recorrer(dir);
  return r;
}

export function analizar(textoIssue, dirChange) {
  const ids = criteriosDelIssue(textoIssue);
  const criterios = Object.fromEntries(ids.map((id) => [id, { requisitos: [], escenarios: [], tareas: [] }]));
  const inexistentes = new Set();
  const bloquesSinCriterio = [];
  for (const spec of specsDe(dirChange)) {
    const cap = relative(join(dirChange, "specs"), spec).replace(/\\/g, "/").replace(/\/spec\.md$/, "");
    for (const b of bloquesDeSpec(readFileSync(spec, "utf8"))) {
      if (b.criterios.size === 0 && !b.derivado) bloquesSinCriterio.push(`${cap}: ${b.tipo} "${b.nombre}"`);
      for (const id of b.criterios) {
        if (!criterios[id]) {
          inexistentes.add(id);
          continue;
        }
        criterios[id][b.tipo === "requisito" ? "requisitos" : "escenarios"].push(`${cap}: ${b.nombre}`);
      }
    }
  }
  const tareasSinCriterio = [];
  const tareasSinNumero = [];
  const rutaTareas = join(dirChange, "tasks.md");
  if (existsSync(rutaTareas)) {
    for (const linea of readFileSync(rutaTareas, "utf8").split(/\r?\n/)) {
      if (!/^\s*- \[[ xX]\]/.test(linea)) continue;
      const t = linea.match(/^\s*- \[[ xX]\]\s*(\d+(?:\.\d+)*)\s/);
      if (!t) {
        tareasSinNumero.push(linea.trim());
        continue;
      }
      const ca = citas(linea);
      if (ca.size === 0 && !DERIVADO.test(linea)) tareasSinCriterio.push(t[1]);
      for (const id of ca) {
        if (criterios[id]) criterios[id].tareas.push(t[1]);
        else inexistentes.add(id);
      }
    }
  }
  // Un CA queda cubierto solo con al menos un escenario (que vive dentro de un requisito) y al menos una tarea.
  const sinCobertura = ids.filter((id) => criterios[id].escenarios.length === 0 || criterios[id].tareas.length === 0);
  const criteriosInexistentes = [...inexistentes].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
  return { criterios, sinCobertura, tareasSinCriterio, bloquesSinCriterio, criteriosInexistentes, tareasSinNumero };
}

// Tabla de <trabajo>/trazabilidad.md (plantilla trazabilidad.md). Código y Caso los completa una revisión posterior.
export function aMarkdown(r) {
  const lista = (xs) => (xs.length ? xs.join("; ") : "—");
  const huerfanos = [
    ...r.bloquesSinCriterio.map((b) => `- Sin CA ni decisión: ${b}`),
    ...r.tareasSinCriterio.map((t) => `- Tarea sin CA ni decisión: ${t}`),
    ...r.tareasSinNumero.map((t) => `- Tarea sin número: ${t}`),
    ...r.criteriosInexistentes.map((c) => `- Cita a un criterio que no está en el issue: ${c}`),
  ];
  const ok = r.sinCobertura.length === 0 && huerfanos.length === 0;
  return [
    "# Trazabilidad",
    "",
    "Generado por `trazabilidad-grep.mjs` (CA → requisito/escenario → tarea). Código y Caso: pendientes de la trazabilidad final (pospuesta).",
    "",
    "| Criterio | Tarea | Requisito | Escenario | Código | Caso | Estado |",
    "|---|---|---|---|---|---|---|",
    ...Object.entries(r.criterios).map(([id, c]) =>
      `| ${id} | ${lista(c.tareas)} | ${lista(c.requisitos)} | ${lista(c.escenarios)} | — | — | ${r.sinCobertura.includes(id) ? "Pendiente" : "Cubierto en spec y tareas"} |`),
    "",
    "## Huérfanos",
    "",
    ...(huerfanos.length ? huerfanos : ["- (ninguno)"]),
    "",
    `Veredicto: ${ok ? "completa" : "incompleta"}`,
    "",
  ].join("\n");
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [issue, change] = o._;
  if (!issue || !change) fallar("Uso: trazabilidad-grep.mjs <issue.md> <dir-del-change> [--salida <ruta.md>]", 2);
  const r = analizar(readFileSync(issue, "utf8"), change);
  if (typeof o.salida === "string") writeFileSync(o.salida, aMarkdown(r));
  console.log(JSON.stringify(r, null, 2));
}
