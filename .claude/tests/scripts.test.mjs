// CA-6: scripts y plantillas del orquestador, probados sobre las fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { leer, RAIZ } from "./util.mjs";
import { escribirCampo, leerCampo } from "../skills/orquestador/scripts/estado.mjs";
import { calcular, componer, leerMarcas, resumenMarkdown } from "../skills/orquestador/scripts/tiempos.mjs";
import { extraerPuerto } from "../skills/orquestador/scripts/puerto.mjs";
import { aMarkdown, analizar, criteriosDelIssue, decisionesCitadas, decisionesRegistradas, pruebasDeHistoria, pruebasDeTexto } from "../skills/orquestador/scripts/trazabilidad-grep.mjs";
import { filaDeAgente, registrarAgente } from "../skills/orquestador/scripts/registrar-agente.mjs";
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

test("CA-6: tiempos.mjs calcula la duración de cada paso y el total contra la meta de 5 minutos", () => {
  const marcas = [{ paso: 1, hora: "2026-11-21T10:00:20Z" }, { paso: 2, hora: "2026-11-21T10:00:22Z" }, { paso: 3, hora: "2026-11-21T10:01:52Z" }];
  const r = calcular("2026-11-21T10:00:00Z", marcas, new Date("2026-11-21T10:02:30Z"));
  assert.deepEqual(r.pasos.map((p) => [p.paso, p.segundos]), [[1, 20], [2, 2], [3, 90], [4, 38]]);
  assert.match(r.pasos[3].nombre, /G2 \(hasta el resumen\)/);
  assert.equal(r.total, 150);
  assert.equal(r.dentro, true);
  assert.match(resumenMarkdown(r), /Total: 2 min 30 s \(150 s\)\. Meta: ≤ 5 min 00 s\. Dentro de la meta\./);
  const fuera = calcular("2026-11-21T10:00:00Z", [], new Date("2026-11-21T10:06:01Z"));
  assert.match(resumenMarkdown(fuera), /\*\*Fuera de la meta por 1 min 01 s\.\*\*/);
});

test("CA-6: estado.mjs registra en tiempos.md la hora de cada paso cerrado, sin perder marcas tras un resumen", () => {
  const dir = temporal();
  try {
    const run = (...a) => spawnSync(process.execPath, a, { encoding: "utf8" });
    const T = join(SCRIPTS, "tiempos.mjs");
    const E = join(SCRIPTS, "estado.mjs");
    assert.equal(run(E, "escribir", "900", "Última fase cerrada", "1", "--trabajo", dir).status, 0);
    assert.ok(!existsSync(join(dir, "tiempos.md")), "sin inicio, la corrida no se mide");
    assert.equal(run(T, "inicio", "900", "--trabajo", dir).status, 0);
    assert.equal(run(E, "escribir", "900", "Última fase cerrada", "1", "--trabajo", dir).status, 0);
    assert.equal(run(T, "resumen", "900", "--trabajo", dir).status, 0);
    assert.equal(run(E, "escribir", "900", "Última fase cerrada", "2", "--trabajo", dir).status, 0);
    const { marcas } = leerMarcas(readFileSync(join(dir, "tiempos.md"), "utf8"));
    assert.deepEqual(marcas.map((m) => m.paso), [1, 2]);
    assert.match(componer("Inicio: x", marcas), /\| 2 \| \d{4}-/);
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

test("CA-6: trazabilidad-grep.mjs --decisiones señala cada decisión citada sin fila en decisiones.md", () => {
  const dir = temporal();
  try {
    mkdirSync(join(dir, "specs", "acerca"), { recursive: true });
    writeFileSync(join(dir, "specs", "acerca", "spec.md"), "## ADDED Requirements\n### Requirement: R (CA-1)\nEl sistema SHALL x (Derivado: decisión #2).\n#### Scenario: E (CA-1)\n- **WHEN** x\n- **THEN** y\n");
    writeFileSync(join(dir, "tasks.md"), "## 1. Capa\n\n- [ ] 1.1 Hacer algo (CA-1)\n- [ ] 1.2 Otra (Derivado: decisión #3)\n");
    writeFileSync(join(dir, "design.md"), "La versión sale de package.json (Decisión #1) y se cachea (decisión #12).\n");
    assert.deepEqual(decisionesCitadas(dir), [1, 2, 3, 12]);
    const decisiones = "# Decisiones\n\n| # | Fecha | Fase | Decisión |\n|---|---|---|---|\n| 1 | 2026-11-21 | 3 | a |\n| #3 | 2026-11-21 | 3 | b |\n";
    assert.deepEqual([...decisionesRegistradas(decisiones)], [1, 3]);
    const issue = "## Criterios numerados\n\n- CA-1: a\n";
    const r = analizar(issue, dir, null, decisiones);
    assert.deepEqual(r.decisionesSinFila, ["#2", "#12"]);
    const md = aMarkdown(r);
    assert.match(md, /- Decisión citada sin fila en decisiones\.md: #2/);
    assert.match(md, /Veredicto: incompleta/, "una decisión sin fila la rechazaría G2");
    assert.deepEqual(analizar(issue, dir, null, "").decisionesSinFila, ["#1", "#2", "#3", "#12"], "decisiones.md vacío: faltan todas");
    // Listas, como las escribió la HU 3: "decisión #1, #5, #6" y "decisiones #11 y #12".
    writeFileSync(join(dir, "proposal.md"), "Se apoya en la decisión #1, #5, #6 y en las decisiones #20 y #21. La tarea 3.2 (#99 no es una decisión).\n");
    assert.deepEqual(decisionesCitadas(dir), [1, 2, 3, 5, 6, 12, 20, 21]);
    assert.equal(analizar(issue, dir).decisionesSinFila, undefined, "sin --decisiones, la salida no cambia");
    // Como comando: el archivo de decisiones del ejemplo cubre la única decisión que cita change-ok.
    const run = spawnSync(process.execPath, [join(SCRIPTS, "trazabilidad-grep.mjs"), join(FIX, "trabajo-ejemplo", "issue.md"), join(FIX, "change-ok"),
      "--decisiones", join(FIX, "trabajo-ejemplo", "decisiones.md")], { encoding: "utf8" });
    assert.deepEqual(JSON.parse(run.stdout).decisionesSinFila, []);
    const sinArchivo = spawnSync(process.execPath, [join(SCRIPTS, "trazabilidad-grep.mjs"), join(FIX, "trabajo-ejemplo", "issue.md"), join(FIX, "change-ok"),
      "--decisiones", join(dir, "no-existe.md")], { encoding: "utf8" });
    assert.deepEqual(JSON.parse(sinArchivo.stdout).decisionesSinFila, ["#1"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: registrar-agente.mjs agrega la fila con la hora real, marca el paso y actualiza estado.md", () => {
  const dir = temporal();
  try {
    const run = (...a) => spawnSync(process.execPath, a, { encoding: "utf8" });
    const R = join(SCRIPTS, "registrar-agente.mjs");
    assert.equal(run(join(SCRIPTS, "tiempos.mjs"), "inicio", "900", "--trabajo", dir).status, 0);
    assert.equal(run(R, "900", "1 Preparar", "preparador", "sonnet / medium", "a1b2", "OK", "--trabajo", dir).status, 0);
    assert.equal(run(join(SCRIPTS, "contexto.mjs"), "900", "--raiz", join(FIX, "repo-ejemplo"), "--trabajo", dir).status, 0);
    assert.equal(run(R, "900", "3 Propuesta", "sesión (openspec-propose)", "opus", "-", "acerca propuesto", "--trabajo", dir).status, 0);
    const corregir = run(R, "900", "4 G2 (intento 1)", "revisor-salida", "sonnet / medium", "c3d4", "CORREGIR", "1", "CRITICAL:", "decisiones", "sin", "fila", "--trabajo", dir);
    assert.equal(corregir.status, 0, corregir.stderr);
    const estado = () => readFileSync(join(dir, "estado.md"), "utf8");
    assert.equal(leerCampo(estado(), "Última fase cerrada"), "3", "un CORREGIR no cierra la fase 4");
    assert.equal(run(R, "900", "4 G2 (intento 2)", "revisor-salida", "sonnet / medium", "e5f6", "APROBADO", "--trabajo", dir).status, 0);
    assert.equal(leerCampo(estado(), "Última fase cerrada"), "4");
    const log = readFileSync(join(dir, "agentes-log.md"), "utf8");
    assert.match(log, /\| Fecha-hora \| Paso \| Agente \| Modelo \/ effort \| Id del agente \| Veredicto \| Rechazos \|/, "crea el registro desde la plantilla");
    assert.match(log, /\| \d{4}-\d{2}-\d{2}T[\d:.]+Z \| 4 G2 \(intento 1\) \| revisor-salida \| sonnet \/ medium \| c3d4 \| CORREGIR \| 1 CRITICAL: decisiones sin fila \|/);
    assert.match(log, /\| 3 Propuesta \| sesión \(openspec-propose\) \| opus \| — \| acerca propuesto \| — \|/);
    const { marcas } = leerMarcas(readFileSync(join(dir, "tiempos.md"), "utf8"));
    assert.deepEqual(marcas.map((m) => m.paso), [1, 2, 3, 4, 4], "contexto.mjs cierra el paso 2 y cada intento de G2 deja su marca");
    assert.equal(run(join(SCRIPTS, "tiempos.mjs"), "resumen", "900", "--trabajo", dir).status, 0, "el resumen admite un paso repetido");
    // Un rechazo real, en un solo argumento: con #, paréntesis, punto y coma, barra vertical y un "--" dentro.
    const rechazo = "1 CRITICAL: tarea 3.2 cita decisión #4 (sin fila); falta --strict | y más";
    assert.equal(run(R, "900", "6 Verificar", "revisor-reglas", "sonnet / high", "g7h8", "1 CRITICAL", rechazo, "--trabajo", dir).status, 0);
    const agentes = agentesDesdeLog(readFileSync(join(dir, "agentes-log.md"), "utf8"), 900);
    assert.equal((agentes.match(/^\| (?!Paso|---)/gm) ?? []).length, 5, "copiar-evidencias entiende las filas del script");
    assert.match(agentes, /\| 1 CRITICAL \| 1 CRITICAL: tarea 3\.2 cita decisión #4 \(sin fila\); falta --strict \\\| y más \|/, "el rechazo llega entero a agentes.md");
    assert.equal(run(R, "900", "Preparar", "preparador", "sonnet", "x", "OK", "--trabajo", dir).status, 2, "el paso empieza por su número");
    assert.equal(run(R, "900", "1").status, 2);
    assert.equal(filaDeAgente({ paso: "6 Verificar", agente: "revisor-reglas", modelo: "sonnet / high", id: "z", veredicto: "0 CRITICAL", rechazos: "a | b\nc" }, new Date("2026-11-22T10:00:00Z")),
      "| 2026-11-22T10:00:00.000Z | 6 Verificar | revisor-reglas | sonnet / high | z | 0 CRITICAL | a \\| b c |");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: sin tiempos.md, registrar-agente.mjs registra igual y no mide", () => {
  const dir = temporal();
  try {
    const r = registrarAgente("900", { paso: "1 Preparar", agente: "preparador", modelo: "sonnet / medium", id: "a", veredicto: "OK" }, dir);
    assert.equal(r.medido, false);
    assert.ok(!existsSync(join(dir, "tiempos.md")));
    assert.match(readFileSync(join(dir, "agentes-log.md"), "utf8"), /\| 1 Preparar \| preparador \|/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: tiempos.mjs atribuye al paso 8 lo que queda tras verificar o corregir", () => {
  const ahora = new Date("2026-11-21T10:10:00Z");
  const tras6 = calcular("2026-11-21T10:00:00Z", [{ paso: 5, hora: "2026-11-21T10:05:00Z" }, { paso: 6, hora: "2026-11-21T10:08:00Z" }], ahora);
  assert.deepEqual(tras6.pasos.map((p) => [p.paso, p.segundos]), [[5, 300], [6, 180], [8, 120]]);
  assert.match(tras6.pasos[2].nombre, /Commit, PR y evidencias \(hasta el resumen\)/);
  const tras7 = calcular("2026-11-21T10:00:00Z", [{ paso: 7, hora: "2026-11-21T10:09:00Z" }], ahora);
  assert.equal(tras7.pasos.at(-1).paso, 8);
});
