// CA-6 y CA-7: build-test (clasificación código/entorno) y la verificación previa al commit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RAIZ } from "./util.mjs";
import { clasificar, primerError } from "../skills/build-test/scripts/build-test.mjs";
import { decidir } from "../skills/orquestador/scripts/puede-commitear.mjs";
import { leerCampo } from "../skills/orquestador/scripts/estado.mjs";

const BUILD = join(RAIZ, ".claude", "skills", "build-test", "scripts", "build-test.mjs");

// Proyecto falso: cada script de npm imprime un texto y sale con el código indicado.
function proyecto(scripts) {
  const dir = mkdtempSync(join(tmpdir(), "build-test-"));
  const s = {};
  for (const [nombre, [codigo, texto]] of Object.entries(scripts)) {
    s[nombre] = `node -e "console.error('${texto}'); process.exit(${codigo})"`;
  }
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "falso", private: true, scripts: s }));
  return dir;
}

function correr(dir) {
  const trabajo = join(dir, ".flujo", "issue-900");
  const r = spawnSync(process.execPath, [BUILD, "900", "--raiz", dir, "--trabajo", trabajo], { encoding: "utf8" });
  return { codigo: r.status, salida: r.stdout + r.stderr, estado: readFileSync(join(trabajo, "estado.md"), "utf8") };
}

const ok = [0, "ok"];

test("CA-7: clasificar distingue entorno de código", () => {
  assert.equal(clasificar("Error: connect ECONNREFUSED 127.0.0.1:5432"), "entorno");
  assert.equal(clasificar("Cannot connect to the Docker daemon at npipe:////./pipe/docker_engine"), "entorno");
  assert.equal(clasificar('npm ERR! Missing script: "test:integration"'), "entorno");
  assert.equal(clasificar("src/modulos/acerca/service.ts(4,7): error TS2322: Type 'string' is not assignable to type 'number'."), "codigo");
  assert.equal(clasificar("FAIL src/modulos/acerca/__tests__/service.test.ts > devuelve la versión"), "codigo");
  assert.match(primerError("linea\nsrc/x.ts(1,1): error TS2322: algo\notra"), /TS2322/);
});

test("CA-6: build-test en verde escribe BUILD SUCCESS en estado.md", () => {
  const dir = proyecto({ typecheck: ok, "test:unit": ok, "test:integration": ok });
  try {
    const r = correr(dir);
    assert.equal(r.codigo, 0, r.salida);
    assert.match(r.salida, /BUILD SUCCESS/);
    assert.equal(leerCampo(r.estado, "Último build"), "BUILD SUCCESS");
    assert.ok(!Number.isNaN(Date.parse(leerCampo(r.estado, "Fecha del último build"))));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-7: un error de tipos se clasifica como código (salida 1)", () => {
  const dir = proyecto({ typecheck: [1, "src/a.ts(3,5): error TS2322: tipo incorrecto"], "test:unit": ok, "test:integration": ok });
  try {
    const r = correr(dir);
    assert.equal(r.codigo, 1, r.salida);
    assert.match(r.salida, /Paso: typecheck[\s\S]*Clasificación: codigo/);
    assert.equal(leerCampo(r.estado, "Último build"), "BUILD FAILURE (codigo)");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-7: la BD caída se clasifica como entorno (salida 2)", () => {
  const dir = proyecto({ typecheck: ok, "test:unit": ok, "test:integration": [1, "Error: connect ECONNREFUSED 127.0.0.1:5432"] });
  try {
    const r = correr(dir);
    assert.equal(r.codigo, 2, r.salida);
    assert.match(r.salida, /Paso: test:integration[\s\S]*Clasificación: entorno/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-7: sin package.json es un fallo de entorno", () => {
  const dir = mkdtempSync(join(tmpdir(), "build-test-"));
  try {
    const r = correr(dir);
    assert.equal(r.codigo, 2, r.salida);
    assert.match(r.salida, /falta el proyecto/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const estado = (build, fecha) => `| Campo | Valor |\n|---|---|\n| Último build | ${build} |\n| Fecha del último build | ${fecha} |\n`;

test("CA-7: commit se niega sin build verde", () => {
  assert.equal(decidir({ estado: estado("BUILD FAILURE (codigo)", "2026-11-21T10:00:00Z"), rutas: ["src/a.ts"], mtimes: [0] }).puede, false);
  assert.equal(decidir({ estado: "", rutas: ["src/a.ts"], mtimes: [0] }).puede, false);
});

test("CA-7: commit se niega si hay cambios posteriores al build", () => {
  const fecha = "2026-11-21T10:00:00Z";
  const despues = Date.parse(fecha) + 60_000;
  const d = decidir({ estado: estado("BUILD SUCCESS", fecha), rutas: ["src/a.ts"], mtimes: [despues] });
  assert.equal(d.puede, false);
  assert.match(d.motivo, /posteriores/);
});

test("CA-6: commit puede con build verde y reciente, o si solo hay evidencias", () => {
  const fecha = "2026-11-21T10:00:00Z";
  assert.equal(decidir({ estado: estado("BUILD SUCCESS", fecha), rutas: ["src/a.ts"], mtimes: [Date.parse(fecha) - 1000] }).puede, true);
  assert.equal(decidir({ estado: "", rutas: ["evidencias/issue-9/agentes.md"], mtimes: [Date.now()] }).puede, true);
});
