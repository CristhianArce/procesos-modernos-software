// Busca cada CA-n de issue.md en las specs y tareas de un change (apoyo para G2 y el agente trazabilidad).
// Uso: node .claude/skills/orquestador/scripts/trazabilidad-grep.mjs <issue.md> <dir-del-change>
// Salida: JSON { criterios: { "CA-1": { requisitos, escenarios, tareas } }, sinCobertura, tareasSinCriterio }
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { esPrincipal, fallar } from "./comun.mjs";

export function criteriosDelIssue(textoIssue) {
  const ids = new Set();
  const seccion = textoIssue.split(/^## Criterios numerados\s*$/m)[1] ?? textoIssue;
  for (const m of seccion.matchAll(/\bCA-(\d+)\b/g)) ids.add(`CA-${m[1]}`);
  return [...ids].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
}

const citas = (texto) => new Set([...texto.matchAll(/\bCA-(\d+)\b/g)].map((m) => `CA-${m[1]}`));

// Recorre un spec.md y devuelve [{ tipo: requisito|escenario, nombre, criterios }].
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
  return bloques.map(({ tipo, nombre, texto }) => ({ tipo, nombre, criterios: citas(texto) }));
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
  for (const spec of specsDe(dirChange)) {
    const cap = relative(join(dirChange, "specs"), spec).replace(/\\/g, "/").replace(/\/spec\.md$/, "");
    for (const b of bloquesDeSpec(readFileSync(spec, "utf8"))) {
      for (const id of b.criterios) {
        if (!criterios[id]) continue;
        criterios[id][b.tipo === "requisito" ? "requisitos" : "escenarios"].push(`${cap}: ${b.nombre}`);
      }
    }
  }
  const tareasSinCriterio = [];
  const rutaTareas = join(dirChange, "tasks.md");
  if (existsSync(rutaTareas)) {
    for (const linea of readFileSync(rutaTareas, "utf8").split(/\r?\n/)) {
      const t = linea.match(/^\s*- \[[ xX]\]\s*(\d+(?:\.\d+)*)\s/);
      if (!t) continue;
      const ca = citas(linea);
      if (ca.size === 0 && !/Derivado: decisión #\d+/.test(linea)) tareasSinCriterio.push(t[1]);
      for (const id of ca) criterios[id]?.tareas.push(t[1]);
    }
  }
  const sinCobertura = ids.filter((id) => {
    const c = criterios[id];
    return (c.requisitos.length === 0 && c.escenarios.length === 0) || c.tareas.length === 0;
  });
  return { criterios, sinCobertura, tareasSinCriterio };
}

if (esPrincipal(import.meta.url)) {
  const [issue, change] = process.argv.slice(2);
  if (!issue || !change) fallar("Uso: trazabilidad-grep.mjs <issue.md> <dir-del-change>", 2);
  console.log(JSON.stringify(analizar(readFileSync(issue, "utf8"), change), null, 2));
}
