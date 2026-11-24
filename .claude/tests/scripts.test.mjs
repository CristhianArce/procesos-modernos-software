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
import { aMarkdown, analizar, criteriosDelIssue, decisionesCitadas, decisionesRegistradas, pruebasDeHistoria, pruebasDeTexto } from "../skills/orquestador/scripts/trazabilidad-grep.mjs";
import { filaDeAgente, registrarAgente } from "../skills/orquestador/scripts/registrar-agente.mjs";
import { agentesDesdeLog, copiarEvidencias } from "../skills/orquestador/scripts/copiar-evidencias.mjs";
import { capacidadesEspecificadas, changesActivos, generarContexto, rutasDelContrato, tablasDeMigraciones } from "../skills/orquestador/scripts/contexto.mjs";

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
    const r = run(R, "901", "4 Revisar propuesta (intento 1)", "revisor-salida", "sonnet / medium", "abc", "APROBADO", "--trabajo", dir, "--paralelo");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(dir, "tiempos.md"), "utf8"), antes, "sin marca de tiempo nueva");
    assert.equal(leerCampo(readFileSync(join(dir, "estado.md"), "utf8"), "Última fase cerrada"), "5", "la fase no retrocede");
    assert.match(readFileSync(join(dir, "agentes-log.md"), "utf8"), /4 Revisar propuesta \(intento 1\) \| revisor-salida/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: preparar.mjs deriva el slug, copia los CA-n y distingue los cambios con seguimiento", async () => {
  const { armarIssueMd, extraerCriterios, hayCambiosConSeguimiento, seccion, slugDeTitulo } = await import("../skills/orquestador/scripts/preparar.mjs");
  assert.equal(slugDeTitulo("PRÁCTICA: Página Acerca de la app y su versión"), "practica-pagina-acerca-de-la");
  assert.equal(slugDeTitulo("¡¡¡"), "historia");
  const issue = leer(".claude/fixtures/trabajo-ejemplo/issue.md");
  const { criterios, numerados } = extraerCriterios(issue);
  assert.deepEqual(criterios.map((c) => c.id), ["CA-1", "CA-2", "CA-3"]);
  assert.equal(numerados, true);
  assert.match(criterios[0].texto, /^Dado un usuario autenticado/);
  const sinNumerar = extraerCriterios("## Criterios de aceptación\n\n- Uno\n- Dos\n");
  assert.deepEqual(sinNumerar.criterios.map((c) => c.id), ["CA-1", "CA-2"]);
  assert.equal(sinNumerar.numerados, false);
  assert.deepEqual(extraerCriterios("## Historia\n\nSin criterios").criterios, []);
  assert.equal(seccion("## A\n\nuno\n\n## B\n\ndos", /^## B/), "dos");
  assert.equal(hayCambiosConSeguimiento("?? .flujo/issue-1/\n"), false, "lo sin seguimiento no cuenta");
  assert.equal(hayCambiosConSeguimiento("?? .flujo/x\n M src/a.ts\n"), true);
  const md = armarIssueMd({ numero: 7, titulo: "Algo", estado: "abierto", etiquetas: ["historia"], cuerpo: "Cuerpo", criterios });
  assert.match(md, /^# Issue #7: Algo/);
  assert.match(md, /## Criterios numerados\n\n- CA-1: Dado un usuario autenticado/);
  assert.match(armarIssueMd({ numero: 7, titulo: "Algo", estado: "abierto", etiquetas: [], cuerpo: "", criterios: [] }), /\(pendiente: el agente deriva los CA-n del cuerpo\)/);
});

test("CA-6: preparar.mjs sale de origin/<base> y, si la base solo existe en local, de la rama local", async () => {
  const { puntoDePartida } = await import("../skills/orquestador/scripts/preparar.mjs");
  assert.equal(puntoDePartida({ remota: true, local: true, base: "main" }), "origin/main");
  assert.equal(puntoDePartida({ remota: false, local: true, base: "refactor-orquestador" }), "refactor-orquestador");
  assert.equal(puntoDePartida({ remota: false, local: false, base: "nada" }), undefined);
});

test("CA-6: paquete-diff.mjs excluye .flujo, .claude, openspec y evidencias, y arma una sola lectura", async () => {
  const { armarPaquete, esExcluido } = await import("../skills/orquestador/scripts/paquete-diff.mjs");
  for (const r of [".flujo/issue-1/x.md", ".claude/agents/a.md", "openspec/changes/c/tasks.md", "evidencias/issue-1/a.md"]) assert.equal(esExcluido(r), true, r);
  for (const r of ["src/a.ts", "e2e/a.spec.ts", "docs/a.md"]) assert.equal(esExcluido(r), false, r);
  const md = armarPaquete({ base: "main", sha: "abc123", modificados: ["src/a.ts"], nuevos: ["src/b.ts"], diff: "+linea", contenidos: [{ ruta: "src/b.ts", texto: "export const b = 1;" }] });
  assert.match(md, /Base: main \(merge-base abc123\)/);
  assert.match(md, /## Archivos modificados \(1\)\n\n- src\/a\.ts/);
  assert.match(md, /```diff\n\+linea\n```/);
  assert.match(md, /## Archivo nuevo: src\/b\.ts[\s\S]*export const b = 1;/);
});

test("CA-6: tiempos.mjs suma la espera de la persona entre los hitos de pregunta y respuesta y da el total sin ella", async () => {
  const { esperaPersona, resumenMarkdown, calcular } = await import("../skills/orquestador/scripts/tiempos.mjs");
  const hitos = [
    { etiqueta: "3 pregunta a la persona", hora: "2026-11-24T10:00:30Z" },
    { etiqueta: "3 respuesta de la persona", hora: "2026-11-24T10:03:30Z" },
    { etiqueta: "5 código listo", hora: "2026-11-24T10:04:00Z" },
    { etiqueta: "5 pregunta a la persona", hora: "2026-11-24T10:05:00Z" },
  ];
  assert.deepEqual(esperaPersona(hitos), { segundos: 180, rondas: 1 }, "una pregunta sin respuesta no suma");
  assert.deepEqual(esperaPersona([]), { segundos: 0, rondas: 0 });
  const r = calcular("2026-11-24T10:00:00Z", [{ paso: 3, hora: "2026-11-24T10:05:00Z" }], new Date("2026-11-24T10:06:00Z"));
  const md = resumenMarkdown(r, [], esperaPersona(hitos));
  assert.match(md, /Espera de la persona: 3 min 00 s en 1 ronda de preguntas\. Total sin la espera: 3 min 00 s \(dentro de la meta\)/);
  assert.doesNotMatch(resumenMarkdown(r, [], esperaPersona([])), /Espera de la persona/, "sin preguntas no se agrega la línea");
});

test("CA-6: tiempos.mjs guarda hitos con nombre sin mover los pasos y los conserva al cerrar un paso", async () => {
  const { duracionesHitos, registrarCierre, registrarHito, leerMarcas: leer2, lineaDeInicio, componer: componer2 } = await import("../skills/orquestador/scripts/tiempos.mjs");
  const dir = temporal();
  try {
    const ruta = join(dir, "tiempos.md");
    writeFileSync(ruta, componer2(lineaDeInicio(new Date("2026-11-24T10:00:00Z")), []));
    assert.equal(registrarCierre(ruta, 3, new Date("2026-11-24T10:01:00Z")), true);
    assert.equal(registrarHito(ruta, "5 código listo", new Date("2026-11-24T10:02:30Z")), true);
    assert.equal(registrarHito(ruta, "5 pruebas reconciliadas", new Date("2026-11-24T10:03:10Z")), true);
    assert.equal(registrarCierre(ruta, 5, new Date("2026-11-24T10:03:20Z")), true, "cerrar un paso conserva los hitos");
    const { inicio, marcas, hitos } = leer2(readFileSync(ruta, "utf8"));
    assert.deepEqual(marcas.map((m) => m.paso), [3, 5], "los hitos no son marcas de paso");
    assert.deepEqual(hitos.map((h) => h.etiqueta), ["5 código listo", "5 pruebas reconciliadas"]);
    assert.deepEqual(duracionesHitos(inicio, marcas, hitos).map((h) => h.segundos), [90, 40], "el primero se mide desde el cierre del paso 3; el segundo, desde el primer hito");
    assert.equal(registrarHito(ruta, "mal | nombre"), false, "una barra vertical rompería la tabla");
    assert.equal(registrarHito(join(dir, "no-existe.md"), "5 código listo"), false, "sin tiempos.md la corrida no se mide");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
