// Compila y prueba la historia: npm run typecheck, test:unit y test:integration (lint y next build quedan para el CI).
// Uso: node .claude/skills/build-test/scripts/build-test.mjs <n> [--sin-bd | --solo <paso> | --comprobar-bd] [--raiz <raiz>] [--trabajo <dir>]
// Antes de test:integration prepara la BD de la corrida con docker compose, proyecto flujo-issue-<n> (levantar, migrar,
// sembrar y DATABASE_URL): ver bd.mjs.
// --sin-bd (modo práctica): solo typecheck y test:unit; no hay BD ni test:integration.
// --solo <paso>: corre un solo paso (para las pruebas de una tarea durante apply). No cuenta como build: no toca estado.md.
// --comprobar-bd: precondición rápida; comprueba que la BD levanta y que .env tiene las credenciales, sin migrar ni probar.
// Salida: BUILD SUCCESS | BUILD FAILURE, paso, primer error y clasificación (codigo | entorno).
// Código de salida: 0 éxito, 1 fallo de código, 2 fallo de entorno.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "../../orquestador/scripts/comun.mjs";
import { escribirCampo, rutaEstado } from "../../orquestador/scripts/estado.mjs";
import { prepararBd, usaCompose } from "./bd.mjs";

export const PASOS = ["typecheck", "test:unit", "test:integration"];
export const PASOS_SIN_BD = ["typecheck", "test:unit"];

// Señales de que el fallo no es del código sino del entorno (Node/npm, Docker, BD, red, disco).
const ENTORNO = [
  /ECONNREFUSED/i, /ENOTFOUND/i, /EAI_AGAIN/i, /ETIMEDOUT/i, /ENOSPC/i,
  /Cannot connect to the Docker daemon/i, /docker daemon is not running/i, /error during connect/i,
  /connection to server .* failed/i, /password authentication failed/i, /database "[^"]+" does not exist/i,
  /Unable to obtain connection from database/i, /Connection refused/i,
  /Missing script:/i, /command not found/i, /no se reconoce como un comando/i, /is not recognized as an internal or external command/i,
  /Cannot find module ['"](?:vitest|typescript|next)/i, /npm ERR! code ENOENT/i, /ENOENT: no such file or directory, open .*package\.json/i,
];

export function clasificar(salida) {
  return ENTORNO.some((r) => r.test(salida)) ? "entorno" : "codigo";
}

// Primer error útil: la primera línea que parece un error, o la última línea no vacía.
export function primerError(salida) {
  const lineas = salida.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lineas.find((l) => /error|fail|✗|×|ECONN|Cannot/i.test(l)) ?? lineas.at(-1) ?? "(sin salida)";
}

export function marcaFecha(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// Un fallo al preparar la BD es de entorno, salvo que Flyway o la semilla rechacen el SQL de la historia (código).
export function falloDeBd(bd) {
  const clasificacion = bd.migracion ? clasificar(bd.salida) : "entorno";
  return { ok: false, paso: bd.paso, clasificacion, error: `${bd.error}.${bd.salida ? ` ${primerError(bd.salida)}` : ""}` };
}

export function buildTest({ raiz, trabajo, log, pasos = PASOS, n }) {
  if (!existsSync(join(raiz, "package.json"))) {
    return { ok: false, paso: "preparación", clasificacion: "entorno", error: "No hay package.json en la raíz (falta el proyecto de la HU 1b)" };
  }
  let env = process.env;
  for (const paso of pasos) {
    if (paso === "test:integration" && usaCompose(raiz)) {
      const bd = prepararBd(raiz, log, { n });
      if (!bd.ok) return falloDeBd(bd);
      env = { ...process.env, DATABASE_URL: bd.url };
    }
    const inicio = Date.now();
    const r = spawnSync("npm", ["run", paso], { cwd: raiz, encoding: "utf8", shell: process.platform === "win32", env });
    const salida = `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? String(r.error) : ""}`;
    appendFileSync(log, `\n===== npm run ${paso} (código ${r.status}, ${Date.now() - inicio} ms) =====\n${salida}`);
    if (r.status !== 0) {
      return { ok: false, paso, clasificacion: clasificar(salida), error: primerError(salida) };
    }
  }
  return { ok: true };
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const n = o._[0];
  if (!n) fallar("Uso: build-test.mjs <n> [--sin-bd | --solo <paso> | --comprobar-bd] [--raiz <raiz>] [--trabajo <dir>]", 2);
  if (o.solo !== undefined && !PASOS.includes(o.solo)) fallar(`--solo espera uno de: ${PASOS.join(", ")}`, 2);
  const pasos = o.solo ? [o.solo] : o["sin-bd"] ? PASOS_SIN_BD : PASOS;
  const raiz = o.raiz ?? raizRepo();
  if (o["comprobar-bd"]) {
    if (!usaCompose(raiz)) {
      console.log("BD: sin comprobar (DATABASE_URL ya está definida o no hay docker-compose.yml)");
      process.exit(0);
    }
    const bd = prepararBd(raiz, null, { n, migrar: false });
    console.log(bd.ok ? "BD OK: levantada y con credenciales" : `BD NO DISPONIBLE\nPaso: ${bd.paso}\nError: ${falloDeBd(bd).error}`);
    process.exit(bd.ok ? 0 : 2);
  }
  const trabajo = o.trabajo ?? dirTrabajo(n, raiz);
  mkdirSync(trabajo, { recursive: true });
  const fecha = new Date();
  const log = join(trabajo, `build-${marcaFecha(fecha)}.log`);
  writeFileSync(log, `build-test del issue #${n} en ${raiz}\n`);
  const r = buildTest({ raiz, trabajo, log, pasos, n });
  const titulo = o.solo ? "PASO" : "BUILD";
  if (!o.solo) {
    // Solo el build completo cuenta para el commit (puede-commitear.mjs lee estos campos).
    const ruta = rutaEstado(n, trabajo);
    let estado = readFileSync(ruta, "utf8");
    estado = escribirCampo(estado, "Último build", r.ok ? "BUILD SUCCESS" : `BUILD FAILURE (${r.clasificacion})`);
    estado = escribirCampo(estado, "Log del último build", log);
    estado = escribirCampo(estado, "Fecha del último build", fecha.toISOString());
    writeFileSync(ruta, estado);
  }
  if (r.ok) {
    console.log(`${titulo} SUCCESS\nPasos: ${pasos.join(", ")}\nLog: ${log}`);
    process.exit(0);
  }
  console.log(`${titulo} FAILURE\nPaso: ${r.paso}\nClasificación: ${r.clasificacion}\nPrimer error: ${r.error}\nLog: ${log}`);
  process.exit(r.clasificacion === "entorno" ? 2 : 1);
}
