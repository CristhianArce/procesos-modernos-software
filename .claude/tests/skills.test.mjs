// CA-6 y CA-7: build-test (clasificación código/entorno) y la verificación previa al commit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { RAIZ } from "./util.mjs";
import { clasificar, primerError } from "../skills/build-test/scripts/build-test.mjs";
import { credenciales, leerEnv, proyectoDe, urlBd } from "../skills/build-test/scripts/bd.mjs";
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

test("CA-6: build-test --sin-bd (modo práctica) no corre test:integration", () => {
  const dir = proyecto({ typecheck: ok, "test:unit": ok, "test:integration": [1, "Error: connect ECONNREFUSED 127.0.0.1:5432"] });
  try {
    const trabajo = join(dir, ".flujo", "issue-900");
    const r = spawnSync(process.execPath, [BUILD, "900", "--sin-bd", "--raiz", dir, "--trabajo", trabajo], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /BUILD SUCCESS\nPasos: typecheck, test:unit\n/);
    assert.equal(correr(dir).codigo, 2, "sin --sin-bd la integración sí corre");
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

// docker falso: registra cada llamada en llamadas.log (sin el prefijo "compose -p <proyecto>", que va a proyecto.log)
// y responde según el subcomando. FALLA_DOCKER=<subcomando> lo hace fallar; con FALLA_VECES=1, solo la primera vez.
function dockerFalso(dir) {
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "docker.cjs"), [
    'const fs = require("node:fs"), path = require("node:path");',
    'const en = (f) => path.join(__dirname, "..", f);',
    "const [, , proyecto, ...args] = process.argv.slice(2);",
    'fs.appendFileSync(en("llamadas.log"), args.join(" ") + "\\n");',
    'fs.writeFileSync(en("proyecto.log"), proyecto + " SESSION_SECRET=" + (process.env.SESSION_SECRET ? "definida" : "vacía"));',
    'const sub = args[0] === "run" ? args[2] : args[0];',
    "if (process.env.FALLA_DOCKER === sub) {",
    '  const veces = fs.existsSync(en("fallos.log")) ? fs.readFileSync(en("fallos.log"), "utf8").length : 0;',
    "  if (!process.env.FALLA_VECES || veces < Number(process.env.FALLA_VECES)) {",
    '    fs.appendFileSync(en("fallos.log"), "x");',
    "    console.error(process.env.FALLA_TEXTO);",
    "    process.exit(1);",
    "  }",
    "}",
    'if (sub === "port") console.log("0.0.0.0:54321");',
  ].join("\n"));
  writeFileSync(join(bin, "docker.cmd"), '@node "%~dp0docker.cjs" %*\r\n');
  writeFileSync(join(bin, "docker"), '#!/bin/sh\nexec node "$(dirname "$0")/docker.cjs" "$@"\n', { mode: 0o755 });
  return bin;
}

// Proyecto con docker-compose.yml y .env: la integración solo pasa si recibe la DATABASE_URL que arma bd.mjs.
function proyectoConBd() {
  const dir = mkdtempSync(join(tmpdir(), "build-test-bd-"));
  const URL_ESPERADA = "postgres://tablero:cl%40ve%20rara@localhost:54321/tablero_dev";
  writeFileSync(join(dir, "integracion.cjs"), `process.exit(process.env.DATABASE_URL === "${URL_ESPERADA}" ? 0 : 1);`);
  writeFileSync(join(dir, "semilla.cjs"), 'require("node:fs").writeFileSync("semilla.hecha", process.env.DATABASE_URL ? "con url" : "sin url");');
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "falso", private: true, scripts: {
    typecheck: "node -e 0", "test:unit": "node -e 0", "test:integration": "node integracion.cjs", seed: "node semilla.cjs",
  } }));
  writeFileSync(join(dir, "docker-compose.yml"), "services: {}\n");
  writeFileSync(join(dir, ".env"), '# local\nPOSTGRES_USER=tablero\nPOSTGRES_PASSWORD="cl@ve rara"\nPOSTGRES_DB=tablero_dev\n');
  return { dir, bin: dockerFalso(dir) };
}

function correrConBd({ dir, bin }, extra = [], env = {}) {
  const trabajo = join(dir, ".flujo", "issue-900");
  const entorno = { ...process.env, ...env, PATH: `${bin}${delimiter}${process.env.PATH}` };
  if (!("DATABASE_URL" in env)) delete entorno.DATABASE_URL;
  const r = spawnSync(process.execPath, [BUILD, "900", "--raiz", dir, "--trabajo", trabajo, ...extra], { encoding: "utf8", env: entorno });
  const leerSi = (ruta) => (existsSync(ruta) ? readFileSync(ruta, "utf8") : "");
  return { codigo: r.status, salida: r.stdout + r.stderr, estado: leerSi(join(trabajo, "estado.md")), llamadas: leerSi(join(dir, "llamadas.log")).trim().split("\n").filter(Boolean) };
}

test("CA-6: bd.mjs lee .env y arma DATABASE_URL con el puerto efímero, escapando la clave", () => {
  const env = leerEnv('# c\nexport POSTGRES_USER=u\nPOSTGRES_PASSWORD="p@ss w"\nPOSTGRES_DB=\'d\'\nVACIA=\n');
  assert.deepEqual(env, { POSTGRES_USER: "u", POSTGRES_PASSWORD: "p@ss w", POSTGRES_DB: "d", VACIA: "" });
  assert.equal(urlBd(env, 5433), "postgres://u:p%40ss%20w@localhost:5433/d");
  assert.throws(() => urlBd({ POSTGRES_USER: "u" }, 1), /Faltan en \.env \(o en el entorno\): POSTGRES_PASSWORD, POSTGRES_DB/);
  // Comentarios al final de la línea, como los lee docker compose; un # pegado al valor es parte del valor.
  assert.deepEqual(leerEnv('A=p # clave\nB="d" # x\nC=a=b#c\nD = con espacios  \nE="con # dentro"\n'), { A: "p", B: "d", C: "a=b#c", D: "con espacios", E: "con # dentro" });
});

test("CA-6: las credenciales del entorno pisan las de .env, como en docker compose", () => {
  const dir = mkdtempSync(join(tmpdir(), "bd-cred-"));
  try {
    assert.deepEqual(credenciales(dir, { POSTGRES_USER: "u", OTRA: "x" }), { POSTGRES_USER: "u" }, "sin .env, solo el entorno");
    writeFileSync(join(dir, ".env"), "POSTGRES_USER=archivo\nPOSTGRES_DB=d\nSESSION_SECRET=\n");
    assert.deepEqual(credenciales(dir, { POSTGRES_USER: "entorno" }), { POSTGRES_USER: "entorno", POSTGRES_DB: "d", SESSION_SECRET: "" });
    assert.equal(proyectoDe(20), "flujo-issue-20");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CA-6: build-test levanta la BD, migra, siembra y pasa DATABASE_URL a la integración", () => {
  const p = proyectoConBd();
  try {
    const r = correrConBd(p);
    assert.equal(r.codigo, 0, r.salida);
    assert.deepEqual(r.llamadas, ["up -d --wait db", "run --rm flyway migrate", "port db 5432"]);
    // BD propia del issue, y SESSION_SECRET de relleno para que compose pueda interpolar un .env que solo trae Postgres.
    assert.equal(readFileSync(join(p.dir, "proyecto.log"), "utf8"), "flujo-issue-900 SESSION_SECRET=definida");
    assert.equal(readFileSync(join(p.dir, "semilla.hecha"), "utf8"), "con url");
    assert.equal(leerCampo(r.estado, "Último build"), "BUILD SUCCESS");
    const log = readFileSync(leerCampo(r.estado, "Log del último build"), "utf8");
    assert.doesNotMatch(log, /cl%40ve|cl@ve/, "la clave de la BD no llega al log");
  } finally {
    rmSync(p.dir, { recursive: true, force: true });
  }
});

test("CA-6: con DATABASE_URL ya definida, build-test no toca Docker", () => {
  const p = proyectoConBd();
  try {
    const r = correrConBd(p, [], { DATABASE_URL: "postgres://tablero:cl%40ve%20rara@localhost:54321/tablero_dev" });
    assert.equal(r.codigo, 0, r.salida);
    assert.deepEqual(r.llamadas, []);
  } finally {
    rmSync(p.dir, { recursive: true, force: true });
  }
});

test("CA-7: Docker caído o sin .env es entorno (salida 2); un SQL que Flyway rechaza es código (salida 1)", () => {
  const p = proyectoConBd();
  try {
    const caido = correrConBd(p, [], { FALLA_DOCKER: "up", FALLA_TEXTO: "error during connect: open //./pipe/dockerDesktopLinuxEngine" });
    assert.equal(caido.codigo, 2, caido.salida);
    assert.match(caido.salida, /Paso: bd: docker compose up[\s\S]*Clasificación: entorno/);
    const sql = correrConBd(p, [], { FALLA_DOCKER: "flyway", FALLA_TEXTO: 'ERROR: syntax error at or near "TABEL"' });
    assert.equal(sql.codigo, 1, sql.salida);
    assert.match(sql.salida, /Paso: bd: flyway migrate[\s\S]*Clasificación: codigo/);
    rmSync(join(p.dir, ".env"));
    const sinEnv = correrConBd(p);
    assert.equal(sinEnv.codigo, 2, sinEnv.salida);
    assert.match(sinEnv.salida, /Falta \.env/);
  } finally {
    rmSync(p.dir, { recursive: true, force: true });
  }
});

test("CA-7: si la historia corrigió una migración ya aplicada, build-test recrea la BD de la corrida una vez", () => {
  const p = proyectoConBd();
  try {
    const suma = { FALLA_DOCKER: "flyway", FALLA_TEXTO: "Migration checksum mismatch for migration version 202611221930" };
    const recreada = correrConBd(p, [], { ...suma, FALLA_VECES: "1" });
    assert.equal(recreada.codigo, 0, recreada.salida);
    assert.deepEqual(recreada.llamadas, ["up -d --wait db", "run --rm flyway migrate", "down -v", "up -d --wait db", "run --rm flyway migrate", "port db 5432"]);
    rmSync(join(p.dir, "llamadas.log"));
    rmSync(join(p.dir, "fallos.log"));
    const persiste = correrConBd(p, [], suma);
    assert.equal(persiste.codigo, 1, "si tras recrear sigue fallando, la migración está mal: es código");
    assert.equal(persiste.llamadas.filter((l) => l === "down -v").length, 1, "solo recrea una vez");
  } finally {
    rmSync(p.dir, { recursive: true, force: true });
  }
});

test("CA-7: --solo corre un paso sin contar como build y --comprobar-bd no migra", () => {
  const p = proyectoConBd();
  try {
    const solo = correrConBd(p, ["--solo", "test:integration"]);
    assert.equal(solo.codigo, 0, solo.salida);
    assert.match(solo.salida, /PASO SUCCESS\nPasos: test:integration\n/);
    assert.equal(solo.estado, "", "--solo no escribe estado.md: commit no lo toma por build verde");
    assert.equal(correrConBd(p, ["--solo", "lint"]).codigo, 2);
    rmSync(join(p.dir, "llamadas.log"));
    const pre = correrConBd(p, ["--comprobar-bd"]);
    assert.equal(pre.codigo, 0, pre.salida);
    assert.match(pre.salida, /BD OK/);
    assert.deepEqual(pre.llamadas, ["up -d --wait db", "port db 5432"]);
    const caida = correrConBd(p, ["--comprobar-bd"], { FALLA_DOCKER: "up", FALLA_TEXTO: "error: required variable X is missing a value" });
    assert.equal(caida.codigo, 2);
    assert.match(caida.salida, /required variable X is missing a value/, "la precondición muestra el error real de Docker");
  } finally {
    rmSync(p.dir, { recursive: true, force: true });
  }
});
