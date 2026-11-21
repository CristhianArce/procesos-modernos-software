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
import { analizar, criteriosDelIssue } from "../skills/orquestador/scripts/trazabilidad-grep.mjs";
import { planRenombres } from "../skills/orquestador/scripts/migracion-timestamp.mjs";
import { agentesDesdeLog, copiarEvidencias } from "../skills/orquestador/scripts/copiar-evidencias.mjs";
import { generarContexto, rutasDelContrato, tablasDeMigraciones } from "../skills/orquestador/scripts/contexto.mjs";

const FIX = join(RAIZ, ".claude", "fixtures");
const SCRIPTS = join(RAIZ, ".claude", "skills", "orquestador", "scripts");
const temporal = () => mkdtempSync(join(tmpdir(), "orq-"));

test("CA-6: orquestador.json tiene las claves que usa el orquestador", () => {
  const cfg = JSON.parse(leer(".claude/orquestador.json"));
  for (const k of ["base", "owner", "repo", "revisor", "revisorEspecializado", "limpiarTrabajo"]) assert.ok(k in cfg, `falta ${k}`);
  assert.equal(cfg.base, "main");
  assert.ok(["archivar", "borrar"].includes(cfg.limpiarTrabajo));
});

test("CA-6: hay una plantilla por cada archivo de <trabajo> (especificación 2.1)", () => {
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
