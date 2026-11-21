// CA-6: scripts y plantillas del orquestador, probados sobre las fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { leer, RAIZ } from "./util.mjs";
import { escribirCampo, leerCampo } from "../skills/orquestador/scripts/estado.mjs";
import { extraerPuerto } from "../skills/orquestador/scripts/puerto.mjs";
import { aMarkdown, analizar, criteriosDelIssue, pruebasDeHistoria, pruebasDeTexto } from "../skills/orquestador/scripts/trazabilidad-grep.mjs";
import { planRenombres } from "../skills/orquestador/scripts/migracion-timestamp.mjs";
import { agentesDesdeLog, copiarEvidencias } from "../skills/orquestador/scripts/copiar-evidencias.mjs";
import { capacidadesEspecificadas, changesActivos, generarContexto, rutasDelContrato, tablasDeMigraciones } from "../skills/orquestador/scripts/contexto.mjs";

const FIX = join(RAIZ, ".claude", "fixtures");
const SCRIPTS = join(RAIZ, ".claude", "skills", "orquestador", "scripts");
const temporal = () => mkdtempSync(join(tmpdir(), "orq-"));

test("CA-6: orquestador.json tiene las claves que usa el orquestador", () => {
  const cfg = JSON.parse(leer(".claude/orquestador.json"));
  for (const k of ["base", "owner", "repo", "revisor", "revisorEspecializado", "limpiarTrabajo"]) assert.ok(k in cfg, `falta ${k}`);
  assert.equal(cfg.base, "main");
  assert.ok(["archivar", "borrar"].includes(cfg.limpiarTrabajo));
});

test("CA-6: hay una plantilla por cada archivo de <trabajo> (flujo-orquestador 2.1)", () => {
  const esperadas = ["estado.md", "agentes-log.md", "issue.md", "preguntas.md", "decisiones.md", "contexto.md", "explore.md", "gates.md", "plan-pruebas.md", "plan-smoke.md", "verificacion.md", "ciclo-pr.md", "trazabilidad.md", "pr-body.md", "bloqueo.md", "agentes.md", "review.json"];
  const hay = readdirSync(join(RAIZ, ".claude", "skills", "orquestador", "plantillas"));
  assert.deepEqual(esperadas.filter((e) => !hay.includes(e)), []);
  assert.match(leer(".claude/skills/orquestador/plantillas/agentes-log.md"), /\| Fecha-hora \| Paso \| Agente \| Modelo \/ effort \| Id del agente \| Veredicto \| Rechazos \|/);
  assert.match(leer(".claude/skills/orquestador/plantillas/pr-body.md"), /Closes #<n>[\s\S]*Change: <change>/);
});

test("CA-6: estado.mjs lee y escribe campos de estado.md", () => {
  const texto = readFileSync(join(FIX, "trabajo-ejemplo", "estado.md"), "utf8");
  assert.equal(leerCampo(texto, "Rama"), "feature/issue-900-pagina-acerca-de");
  assert.equal(leerCampo(texto, "Último build"), "BUILD SUCCESS");
  const nuevo = escribirCampo(texto, "PR", "#901");
  assert.equal(leerCampo(nuevo, "PR"), "#901");
  assert.equal(leerCampo(escribirCampo(nuevo, "Campo nuevo", "x"), "Campo nuevo"), "x");
});

test("CA-6: estado.mjs funciona como comando sobre un <trabajo>", () => {
  const dir = temporal();
  try {
    cpSync(join(FIX, "trabajo-ejemplo"), dir, { recursive: true });
    const run = (...a) => spawnSync(process.execPath, [join(SCRIPTS, "estado.mjs"), ...a, "--trabajo", dir], { encoding: "utf8" });
    assert.equal(run("escribir", "900", "Fase en curso", "6").status, 0);
    assert.equal(run("leer", "900", "Fase en curso").stdout.trim(), "6");
    assert.equal(run("leer", "900", "No existe").status, 3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: puerto.mjs extrae el puerto de docker compose port", () => {
  assert.equal(extraerPuerto("0.0.0.0:49153\n"), 49153);
  assert.equal(extraerPuerto("[::]:55001"), 55001);
  assert.equal(extraerPuerto("0.0.0.0:49153\n[::]:49153\n"), 49153);
  assert.equal(extraerPuerto(""), null);
  assert.equal(extraerPuerto("no hay puerto"), null);
});

test("CA-6: trazabilidad-grep.mjs encuentra cada CA en requisitos, escenarios y tareas", () => {
  const issue = readFileSync(join(FIX, "trabajo-ejemplo", "issue.md"), "utf8");
  assert.deepEqual(criteriosDelIssue(issue), ["CA-1", "CA-2", "CA-3"]);
  const r = analizar(issue, join(FIX, "change-ok"));
  assert.deepEqual(r.sinCobertura, []);
  assert.deepEqual(r.tareasSinCriterio, []);
  assert.ok(r.criterios["CA-1"].requisitos.length > 0);
  assert.ok(r.criterios["CA-3"].escenarios.length > 0);
  assert.deepEqual(r.criterios["CA-2"].tareas, ["1.3"]);
});

test("CA-6: trazabilidad-grep.mjs señala un CA sin cobertura", () => {
  const issue = "## Criterios numerados\n\n- CA-1: a\n- CA-4: criterio sin specs ni tareas\n";
  const r = analizar(issue, join(FIX, "change-ok"));
  assert.deepEqual(r.sinCobertura, ["CA-4"]);
  assert.deepEqual(r.criteriosInexistentes, ["CA-2", "CA-3"]);
});

test("CA-6: trazabilidad-grep.mjs exige escenario por CA y señala huérfanos", () => {
  const dir = temporal();
  try {
    mkdirSync(join(dir, "specs", "acerca"), { recursive: true });
    writeFileSync(join(dir, "specs", "acerca", "spec.md"), [
      "## ADDED Requirements",
      "### Requirement: Solo requisito",
      "El sistema SHALL algo (CA-1).",
      "#### Scenario: Escenario sin cita",
      "- **WHEN** x",
      "- **THEN** y",
      "### Requirement: Derivado",
      "El sistema SHALL otra cosa (Derivado: decisión #2).",
      "#### Scenario: Cita un CA inexistente (CA-9)",
      "- **WHEN** x",
      "- **THEN** y",
    ].join("\n"));
    writeFileSync(join(dir, "tasks.md"), "## 1. Capa\n\n- [ ] 1.1 Hacer algo (CA-1)\n- [ ] Tarea sin número (CA-1)\n");
    const r = analizar("## Criterios numerados\n\n- CA-1: a\n", dir);
    assert.deepEqual(r.sinCobertura, ["CA-1"], "un requisito sin escenario no cubre el CA");
    assert.deepEqual(r.bloquesSinCriterio, ['acerca: escenario "Escenario sin cita"']);
    assert.deepEqual(r.criteriosInexistentes, ["CA-9"]);
    assert.deepEqual(r.tareasSinNumero, ["- [ ] Tarea sin número (CA-1)"]);
    const md = aMarkdown(r);
    assert.match(md, /\| CA-1 \| 1\.1 \| acerca: Solo requisito \| — \| — \| — \| Pendiente \|/);
    assert.match(md, /Veredicto: incompleta/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: trazabilidad-grep.mjs con --salida escribe trazabilidad.md", () => {
  const dir = temporal();
  try {
    const salida = join(dir, "trazabilidad.md");
    const r = spawnSync(process.execPath, [join(RAIZ, ".claude", "skills", "orquestador", "scripts", "trazabilidad-grep.mjs"),
      join(FIX, "trabajo-ejemplo", "issue.md"), join(FIX, "change-ok"), "--salida", salida], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout).sinCobertura, []);
    assert.match(readFileSync(salida, "utf8"), /Veredicto: completa/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: trazabilidad-grep.mjs reconoce las pruebas que citan #<n> CA-k", () => {
  const texto = [
    'it("#12 CA-1: a", () => {});',
    'test.skip("#12 CA-2: omitida");',
    "it.each([[1], [2]])(\"#12 CA-3: tabla %s\", () => {});",
    "test.describe.parallel(`#12 CA-4: ${x}`, () => {});",
    "it(",
    '  "#12 CA-5, CA-6: dice \\"x\\"", () => {});',
    'it("#120 CA-7: otra historia");',
    'it("CA-8: sin issue");',
    'test.fixme("#12 CA-9: pendiente");',
    '// it("#12 CA-10: comentada");',
    '/* it("#12 CA-11: en bloque comentado"); */',
    'it.runIf(process.env.CI)("#12 CA-12: solo en CI", () => {});',
    'it.skipIf(lento)("#12 CA-13: salvo si es lento", () => {});',
  ].join("\n");
  const r = pruebasDeTexto(12, "e2e/a.spec.ts", texto);
  assert.deepEqual(r.map((p) => p.criterios), [["CA-1"], ["CA-3"], ["CA-4"], ["CA-5", "CA-6"], ["CA-12"], ["CA-13"]]);
  assert.equal(r[3].nombre, '#12 CA-5, CA-6: dice "x"');
});

test("CA-6: trazabilidad-grep.mjs --pruebas llena Caso y señala los CA sin prueba sin bloquear", () => {
  const dir = temporal();
  try {
    mkdirSync(join(dir, "src", "modulos", "acerca", "__tests__"), { recursive: true });
    mkdirSync(join(dir, "e2e"), { recursive: true });
    writeFileSync(join(dir, "src", "modulos", "acerca", "__tests__", "service.test.ts"), 'it("#6 CA-1: devuelve la versión", () => {});\nit("#7 CA-2: de otra historia", () => {});\n');
    writeFileSync(join(dir, "src", "modulos", "acerca", "service.ts"), '// it("#6 CA-2: fuera de __tests__")\n');
    writeFileSync(join(dir, "e2e", "acerca.spec.ts"), 'test("#6 CA-3: el técnico ve la página", async () => {});\n');
    const pruebas = pruebasDeHistoria(6, dir);
    assert.deepEqual(pruebas.map((p) => p.ruta).sort(), ["e2e/acerca.spec.ts", "src/modulos/acerca/__tests__/service.test.ts"]);
    const issue = readFileSync(join(FIX, "trabajo-ejemplo", "issue.md"), "utf8");
    const r = analizar(issue, join(FIX, "change-ok"), pruebas);
    assert.deepEqual(r.sinCobertura, []);
    assert.deepEqual(r.sinPrueba, ["CA-2"]);
    assert.deepEqual(r.criterios["CA-3"].pruebas, ["e2e/acerca.spec.ts: #6 CA-3: el técnico ve la página"]);
    const md = aMarkdown(r);
    assert.match(md, /\| CA-2 \|[^\n]*\| Sin prueba \| Cubierto en spec y tareas; sin prueba \|/);
    assert.match(md, /Pruebas: 2 de 3 CA con prueba \(sin prueba: CA-2\)/);
    assert.match(md, /Veredicto: completa/, "la falta de prueba no cambia el veredicto de cobertura");
    assert.equal(analizar(issue, join(FIX, "change-ok")).sinPrueba, undefined, "sin --pruebas, la salida de G2 no cambia");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: migracion-timestamp.mjs renombra la migración del change con versión menor que la base", () => {
  const base = readdirSync(join(FIX, "repo-ejemplo", "db", "migration"));
  const rama = [...base, "V202611210500__aislar_nodo.sql"];
  assert.deepEqual(planRenombres(base, rama, "202611211500"), [{ de: "V202611210500__aislar_nodo.sql", a: "V202611211500__aislar_nodo.sql" }]);
  assert.deepEqual(planRenombres(base, [...base, "V202611220900__ok.sql"], "202611211500"), []);
  // Si el reloj va atrás de la base, la versión nueva queda un minuto después de la máxima.
  assert.deepEqual(planRenombres(base, rama, "202611200000"), [{ de: "V202611210500__aislar_nodo.sql", a: "V202611211101__aislar_nodo.sql" }]);
});

test("CA-6: migracion-timestamp.mjs como comando renombra en disco", () => {
  const dir = temporal();
  try {
    mkdirSync(join(dir, "db", "migration"), { recursive: true });
    cpSync(join(FIX, "repo-ejemplo", "db", "migration"), join(dir, "db", "migration"), { recursive: true });
    writeFileSync(join(dir, "db", "migration", "V202611210500__aislar_nodo.sql"), "SELECT 1;");
    const r = spawnSync(process.execPath, [join(SCRIPTS, "migracion-timestamp.mjs"), "--raiz", dir, "--base-dir", join(FIX, "repo-ejemplo", "db", "migration"), "--ahora", "202611211500"], { encoding: "utf8", cwd: dir });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(dir, "db", "migration", "V202611211500__aislar_nodo.sql")));
    assert.ok(!existsSync(join(dir, "db", "migration", "V202611210500__aislar_nodo.sql")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: copiar-evidencias.mjs genera agentes.md y no copia logs", () => {
  const destino = temporal();
  try {
    const copiados = copiarEvidencias("900", join(FIX, "trabajo-ejemplo"), destino);
    const hay = readdirSync(destino);
    assert.ok(hay.includes("agentes.md") && hay.includes("issue.md") && hay.includes("gates.md"));
    assert.deepEqual(hay.filter((a) => a.endsWith(".log")), []);
    assert.ok(!hay.includes("estado.md"), "estado.md es de trabajo, no evidencia");
    assert.ok(copiados.includes("agentes.md"));
    const agentes = readFileSync(join(destino, "agentes.md"), "utf8");
    assert.match(agentes, /\| Paso \| Agente \| Modelo \| Id del agente \| Resultado \| Rechazos y corrección \|/);
    assert.match(agentes, /\| G2 \| revisor-salida \| sonnet \/ medium \| g7h8i9 \| CORREGIR \|/);
    assert.equal((agentes.match(/^\| (?!Paso|---)/gm) ?? []).length, 5);
    assert.doesNotMatch(agentes, /DATABASE_URL/);
  } finally {
    rmSync(destino, { recursive: true, force: true });
  }
});

test("CA-6: agentesDesdeLog ignora cabecera y separador", () => {
  const md = agentesDesdeLog("| Fecha-hora | Paso | Agente | Modelo / effort | Id del agente | Veredicto | Rechazos |\n|---|---|---|---|---|---|---|\n", 1);
  assert.equal((md.match(/^\| (?!Paso|---)/gm) ?? []).length, 0);
});

test("CA-6: contexto.mjs lista tablas con CREATE TABLE y ALTER TABLE … ADD COLUMN", () => {
  const tablas = tablasDeMigraciones(join(FIX, "repo-ejemplo", "db", "migration"));
  assert.deepEqual(tablas.get("acerca").columnas, ["id", "texto", "version"]);
  assert.deepEqual(tablas.get("nodos").columnas, ["id", "nombre", "estado", "ubicacion"]);
  assert.deepEqual(tablas.get("acerca").migraciones, ["V202611211000__acerca.sql", "V202611211100__acerca_version.sql"]);
});

test("CA-6: contexto.mjs lista módulos, semillas y rutas del contrato", () => {
  const md = generarContexto(join(FIX, "repo-ejemplo"));
  assert.match(md, /\| acerca \| menu\.ts \|/);
  assert.match(md, /\| nodos \| menu\.ts, paneles\.ts, metrics\.ts \|/);
  assert.match(md, /- db\/seed\/acerca\.sql/);
  assert.deepEqual(rutasDelContrato(join(FIX, "repo-ejemplo", "contracts", "openapi.yaml")), [
    { ruta: "/api/health", metodos: ["GET"] },
    { ruta: "/api/acerca", metodos: ["GET"] },
    { ruta: "/api/nodos/{id}", metodos: ["GET", "PATCH"] },
  ]);
});

test("CA-6: contexto.mjs lista capacidades de openspec/specs/ y changes activos sin archive", () => {
  const raiz = join(FIX, "repo-ejemplo");
  const caps = capacidadesEspecificadas(join(raiz, "openspec", "specs"));
  assert.equal(caps.length, 1);
  assert.equal(caps[0].capacidad, "acerca");
  assert.match(caps[0].proposito, /^Muestra a los usuarios autenticados/);
  assert.deepEqual(caps[0].requisitos, ["Consulta de la información de la aplicación", "Página Acerca de en el menú", "Acceso sin sesión rechazado"]);
  assert.deepEqual(changesActivos(join(raiz, "openspec", "changes")), ["aislar-nodo"]);
  const md = generarContexto(raiz);
  assert.match(md, /## Capacidades especificadas/);
  assert.match(md, /MODIFIED Requirements/);
  assert.match(md, /\| acerca \| Muestra a los usuarios autenticados[^|]*\| Consulta de la información de la aplicación; /);
  assert.match(md, /- openspec\/changes\/aislar-nodo\//);
  assert.doesNotMatch(md, /changes\/archive/);
});

test("CA-6: contexto.mjs sobre un repo vacío no falla y lo dice", () => {
  const dir = temporal();
  try {
    const md = generarContexto(dir);
    assert.match(md, /\| \(ninguna\) \| \| \|/);
    assert.match(md, /- \(ninguna\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
