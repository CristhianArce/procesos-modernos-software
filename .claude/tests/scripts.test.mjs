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
import { aMarkdown, analizar, criteriosDelIssue, decisionesCitadas, decisionesRegistradas, deltasContraBase, operacionesDeDelta, pruebasDeHistoria, pruebasDeTexto } from "../skills/orquestador/scripts/trazabilidad-grep.mjs";
import { filaDeAgente, registrarAgente } from "../skills/orquestador/scripts/registrar-agente.mjs";
import { agentesDesdeLog, copiarEvidencias } from "../skills/orquestador/scripts/copiar-evidencias.mjs";
import { capacidadesEspecificadas, capacidadesRelacionadas, changesActivos, generarContexto, rutasDelContrato, tablasDeMigraciones } from "../skills/orquestador/scripts/contexto.mjs";

const FIX = join(RAIZ, ".claude", "fixtures");
const SCRIPTS = join(RAIZ, ".claude", "skills", "orquestador", "scripts");
const temporal = () => mkdtempSync(join(tmpdir(), "orq-"));

test("CA-6: orquestador.json tiene las claves que usa el orquestador", () => {
  const cfg = JSON.parse(leer(".claude/orquestador.json"));
  for (const k of ["base"]) assert.ok(k in cfg, `falta ${k}`);
  assert.equal(cfg.base, "main");
});

test("CA-6: hay una plantilla por cada archivo de <trabajo>", () => {
  const esperadas = ["estado.md", "agentes-log.md", "issue.md", "preguntas.md", "decisiones.md", "contexto.md", "gates.md", "verificacion.md", "trazabilidad.md", "pr-body.md", "bloqueo.md", "agentes.md"];
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
    assert.equal(analizar(issue, join(FIX, "change-ok")).sinPrueba, undefined, "sin --pruebas, la salida de la revisión de la propuesta no cambia");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: tiempos.mjs calcula la duración de cada paso y el total contra la meta de 5 minutos", () => {
  const marcas = [{ paso: 1, hora: "2026-11-21T10:00:20Z" }, { paso: 2, hora: "2026-11-21T10:00:22Z" }, { paso: 3, hora: "2026-11-21T10:01:52Z" }];
  const r = calcular("2026-11-21T10:00:00Z", marcas, new Date("2026-11-21T10:02:30Z"));
  assert.deepEqual(r.pasos.map((p) => [p.paso, p.segundos]), [[1, 20], [2, 2], [3, 90], [4, 38]]);
  assert.match(r.pasos[3].nombre, /Revisar propuesta \(hasta el resumen\)/);
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

test("CA-6: un agente en segundo plano (--paralelo) deja su fila sin marca de tiempo ni retroceder la fase", () => {
  const dir = temporal();
  try {
    const run = (...a) => spawnSync(process.execPath, a, { encoding: "utf8" });
    const T = join(SCRIPTS, "tiempos.mjs");
    const E = join(SCRIPTS, "estado.mjs");
    const R = join(SCRIPTS, "registrar-agente.mjs");
    assert.equal(run(E, "escribir", "901", "Última fase cerrada", "0", "--trabajo", dir).status, 0);
    assert.equal(run(T, "inicio", "901", "--trabajo", dir).status, 0);
    assert.equal(run(R, "901", "5 Implementar", "sesión", "sonnet", "-", "8 de 8", "--trabajo", dir).status, 0);
    const antes = readFileSync(join(dir, "tiempos.md"), "utf8");
    const r = run(R, "901", "5 Escribir pruebas (e2e)", "escritor-pruebas", "sonnet / medium", "abc", "OK", "--trabajo", dir, "--paralelo");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(dir, "tiempos.md"), "utf8"), antes, "sin marca de tiempo nueva");
    assert.equal(leerCampo(readFileSync(join(dir, "estado.md"), "utf8"), "Última fase cerrada"), "5", "la fase no retrocede");
    assert.match(readFileSync(join(dir, "agentes-log.md"), "utf8"), /5 Escribir pruebas \(e2e\) \| escritor-pruebas/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const escribirSpec = (dir, capacidad, lineas) => {
  mkdirSync(join(dir, capacidad), { recursive: true });
  writeFileSync(join(dir, capacidad, "spec.md"), lineas.join("\n"));
};

test("CA-8: contexto.mjs trae completas las capacidades que comparten palabras o ruta con el issue", () => {
  const dir = temporal();
  try {
    escribirSpec(dir, "dashboard-de-lecturas", [
      "# x", "", "## Purpose", "", "Muestra las lecturas y las alertas.", "", "## Requirements", "",
      "### Requirement: Última lectura de cada sensor en el dashboard", "El sistema SHALL mostrarla.", "",
      "#### Scenario: Con lecturas", "- **WHEN** hay una", "- **THEN** se ve", "",
    ]);
    escribirSpec(dir, "observabilidad", ["# x", "", "## Purpose", "", "Salud y métricas.", "", "## Requirements", "", "### Requirement: Salud de la app", "Texto.", ""]);
    const r = capacidadesRelacionadas("Quiero ver la última lectura de cada sensor en el histórico", dir);
    assert.deepEqual(r.map((c) => c.capacidad), ["dashboard-de-lecturas"]);
    assert.match(r[0].bloques, /#### Scenario: Con lecturas/, "los escenarios van completos para copiarlos en un MODIFIED");
    assert.deepEqual(capacidadesRelacionadas("Quiero ver la salud", dir), [], "una sola palabra en común no basta");
    assert.deepEqual(capacidadesRelacionadas("Usar GET /api/lecturas", dir).length, 0, "una ruta que ninguna spec cita no relaciona");
    escribirSpec(dir, "salud", ["## Purpose", "", "x", "", "## Requirements", "", "### Requirement: Ruta", "Responde en /api/health.", ""]);
    assert.deepEqual(capacidadesRelacionadas("Agregar un dato a /api/health", dir).map((c) => c.capacidad), ["salud"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-8: generarContexto agrega la sección de capacidades relacionadas solo si se le da el issue", () => {
  const sin = generarContexto(RAIZ);
  const con = generarContexto(RAIZ, "Consultar el histórico de lecturas de cada sensor en el dashboard de lecturas");
  assert.doesNotMatch(sin, /## Capacidades relacionadas con la historia/);
  assert.match(con, /## Capacidades relacionadas con la historia/);
  assert.match(con, /### dashboard-de-lecturas/);
});

test("CA-8: trazabilidad-grep.mjs lee las operaciones de un delta, también RENAMED", () => {
  const ops = operacionesDeDelta([
    "## ADDED Requirements", "### Requirement: Nuevo", "x",
    "## MODIFIED Requirements", "### Requirement: Existente", "x",
    "## RENAMED Requirements", "- FROM: `### Requirement: Viejo`", "- TO: `### Requirement: Otro`",
    "## REMOVED Requirements", "### Requirement: Obsoleto", "**Reason**: x",
  ].join("\n"));
  assert.deepEqual(ops, [
    { operacion: "ADDED", nombre: "Nuevo" },
    { operacion: "MODIFIED", nombre: "Existente" },
    { operacion: "RENAMED", nombre: "Viejo" },
    { operacion: "REMOVED", nombre: "Obsoleto" },
  ]);
});

test("CA-8: trazabilidad-grep.mjs rechaza los deltas que el archivado rechazaría", () => {
  const base = temporal();
  const change = temporal();
  try {
    escribirSpec(base, "acerca", ["## Purpose", "", "x", "", "## Requirements", "", "### Requirement: Página acerca", "x", ""]);
    escribirSpec(join(change, "specs"), "acerca", [
      "## MODIFIED Requirements", "### Requirement: Página  Acerca", "x",
      "### Requirement: Inventado", "x",
      "## ADDED Requirements", "### Requirement: Página acerca", "x",
      "### Requirement: Nuevo", "x", "### Requirement: Nuevo", "x",
    ]);
    escribirSpec(join(change, "specs"), "capacidad-nueva", ["## ADDED Requirements", "### Requirement: A", "x", "## MODIFIED Requirements", "### Requirement: B", "x"]);
    const r = deltasContraBase(change, base);
    assert.deepEqual(r, [
      'acerca: MODIFIED "Inventado" no existe en la spec base',
      'acerca: ADDED "Página acerca" ya existe en la spec base (usa MODIFIED)',
      'acerca: ADDED "Nuevo" aparece dos veces en el delta',
      'capacidad-nueva: MODIFIED "B" no existe en una capacidad sin spec base (solo admite ADDED)',
    ], "«Página  Acerca» (espacios y mayúsculas distintos) sí coincide con la base");
    const rep = analizar("## Criterios numerados\n\n- CA-1: a\n", change, null, null, base);
    assert.equal(rep.deltasInvalidos.length, 4);
    assert.match(aMarkdown(rep), /Delta que el archivado rechazaría: acerca: MODIFIED "Inventado"/);
    assert.match(aMarkdown(rep), /Veredicto: incompleta/);
    assert.equal("deltasInvalidos" in analizar("## Criterios numerados\n\n- CA-1: a\n", change), false, "sin dirSpecsBase no se comprueba");
  } finally {
    rmSync(base, { recursive: true, force: true });
    rmSync(change, { recursive: true, force: true });
  }
});
