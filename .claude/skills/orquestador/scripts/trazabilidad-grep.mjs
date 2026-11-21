// Busca cada CA-n de issue.md en las specs y tareas de un change (apoyo para G2) y, con --pruebas <n>,
// en los nombres de las pruebas automatizadas que citan "#<n> CA-k" (pasos 6 y 8 del orquestador).
// Uso: node .claude/skills/orquestador/scripts/trazabilidad-grep.mjs <issue.md> <dir-del-change> [--pruebas <n>] [--salida <trabajo>/trazabilidad.md]
// Salida: JSON { criterios: { "CA-1": { requisitos, escenarios, tareas, pruebas? } }, sinCobertura, tareasSinCriterio,
//   bloquesSinCriterio, criteriosInexistentes, tareasSinNumero, sinPrueba? }. Con --salida, además escribe la tabla en Markdown.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";

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

// Nombres de it/test/describe de un archivo de prueba (Vitest o Playwright), incluidos .only, .concurrent,
// test.describe.parallel, it.each([...])("..."), it.runIf(c)("...") e it.skipIf(c)("..."). Se excluyen skip, todo
// y fixme (no verifican nada) y las líneas o bloques comentados. Límite conocido: un it dentro de describe.skip cuenta.
const NOMBRE_PRUEBA = /\b(?:it|test|describe)\b((?:\s*\.\s*\w+(?:\s*\([^()]*\))?)*)\s*\(\s*(["'`])((?:\\[\s\S]|(?!\2)[^\\])*)\2/g;
const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
export function nombresDePruebas(texto) {
  const r = [];
  for (const m of sinComentarios(texto).matchAll(NOMBRE_PRUEBA)) {
    if (/\.\s*(?:skip|todo|fixme)\b(?!If)/.test(m[1])) continue;
    r.push(m[3].replace(/\\(.)/g, "$1").replace(/\s+/g, " ").trim());
  }
  return r;
}

// Pruebas que citan la historia: el nombre contiene "#<n>" y uno o más CA-k ("#12 CA-1, CA-3: ...").
// El número del issue hace única la referencia: todas las historias tienen un CA-1.
export function pruebasDeTexto(n, ruta, texto) {
  const issue = new RegExp(`(?:^|[^\\w])#${n}(?!\\d)`);
  return nombresDePruebas(texto)
    .filter((nombre) => issue.test(nombre))
    .map((nombre) => ({ ruta, nombre, criterios: [...citas(nombre)] }))
    .filter((p) => p.criterios.length > 0);
}

const esPrueba = (ruta) => /\.[cm]?[jt]sx?$/.test(ruta) && (ruta.includes("/__tests__/") || ruta.startsWith("e2e/"));
const OMITIR = new Set(["node_modules", ".next", ".git", ".flujo", ".claude", "test-results", "playwright-report"]);

// Recorre src/ y e2e/ de la raíz y devuelve las pruebas que citan "#<n> CA-k". Solo lee archivos: sin git ni red.
export function pruebasDeHistoria(n, raiz) {
  const r = [];
  const recorrer = (d) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d)) {
      if (OMITIR.has(e)) continue;
      const p = join(d, e);
      if (statSync(p).isDirectory()) recorrer(p);
      else {
        const ruta = relative(raiz, p).replace(/\\/g, "/");
        if (esPrueba(ruta)) r.push(...pruebasDeTexto(n, ruta, readFileSync(p, "utf8")));
      }
    }
  };
  recorrer(join(raiz, "src"));
  recorrer(join(raiz, "e2e"));
  return r;
}

// pruebas: null (G2: todavía no hay pruebas) o la lista que devuelve pruebasDeHistoria.
export function analizar(textoIssue, dirChange, pruebas = null) {
  const ids = criteriosDelIssue(textoIssue);
  const criterios = Object.fromEntries(ids.map((id) => [id, { requisitos: [], escenarios: [], tareas: [], ...(pruebas ? { pruebas: [] } : {}) }]));
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
  for (const p of pruebas ?? []) {
    for (const id of p.criterios) {
      if (criterios[id]) criterios[id].pruebas.push(`${p.ruta}: ${p.nombre}`);
      else inexistentes.add(id);
    }
  }
  // Un CA queda cubierto solo con al menos un escenario (que vive dentro de un requisito) y al menos una tarea.
  // La falta de prueba se informa aparte (sinPrueba): no cambia la cobertura ni bloquea.
  const sinCobertura = ids.filter((id) => criterios[id].escenarios.length === 0 || criterios[id].tareas.length === 0);
  const criteriosInexistentes = [...inexistentes].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
  const r = { criterios, sinCobertura, tareasSinCriterio, bloquesSinCriterio, criteriosInexistentes, tareasSinNumero };
  if (pruebas) r.sinPrueba = ids.filter((id) => criterios[id].pruebas.length === 0);
  return r;
}

// Tabla de <trabajo>/trazabilidad.md (plantilla trazabilidad.md). Caso: pruebas que citan "#<n> CA-k" (con --pruebas).
// Código: pendiente de la trazabilidad final (pospuesta).
export function aMarkdown(r) {
  const conPruebas = Array.isArray(r.sinPrueba);
  const caso = (c) => (!conPruebas ? "—" : c.pruebas.length ? c.pruebas.join("; ") : "Sin prueba");
  const estado = (id, c) =>
    r.sinCobertura.includes(id) ? "Pendiente"
      : !conPruebas ? "Cubierto en spec y tareas"
      : c.pruebas.length ? "Cubierto en spec, tareas y pruebas" : "Cubierto en spec y tareas; sin prueba";
  const total = Object.keys(r.criterios).length;
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
    conPruebas
      ? "Generado por `trazabilidad-grep.mjs --pruebas` (CA → requisito/escenario → tarea → prueba). Caso: pruebas cuyo nombre cita `#<n> CA-k`. Código: pendiente de la trazabilidad final (pospuesta)."
      : "Generado por `trazabilidad-grep.mjs` (CA → requisito/escenario → tarea). Caso: se llena en los pasos 6 y 8 con `--pruebas`. Código: pendiente de la trazabilidad final (pospuesta).",
    "",
    "| Criterio | Tarea | Requisito | Escenario | Código | Caso | Estado |",
    "|---|---|---|---|---|---|---|",
    ...Object.entries(r.criterios).map(([id, c]) =>
      `| ${id} | ${lista(c.tareas)} | ${lista(c.requisitos)} | ${lista(c.escenarios)} | — | ${caso(c)} | ${estado(id, c)} |`),
    "",
    "## Huérfanos",
    "",
    ...(huerfanos.length ? huerfanos : ["- (ninguno)"]),
    "",
    ...(conPruebas
      ? [`Pruebas: ${total - r.sinPrueba.length} de ${total} CA con prueba${r.sinPrueba.length ? ` (sin prueba: ${r.sinPrueba.join(", ")})` : ""}`, ""]
      : []),
    `Veredicto: ${ok ? "completa" : "incompleta"}`,
    "",
  ].join("\n");
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [issue, change] = o._;
  if (!issue || !change) fallar("Uso: trazabilidad-grep.mjs <issue.md> <dir-del-change> [--pruebas <n>] [--salida <ruta.md>]", 2);
  if (o.pruebas !== undefined && !/^\d+$/.test(String(o.pruebas))) fallar("--pruebas espera el número del issue", 2);
  const pruebas = o.pruebas !== undefined ? pruebasDeHistoria(Number(o.pruebas), raizRepo()) : null;
  const r = analizar(readFileSync(issue, "utf8"), change, pruebas);
  if (typeof o.salida === "string") writeFileSync(o.salida, aMarkdown(r));
  console.log(JSON.stringify(r, null, 2));
}
