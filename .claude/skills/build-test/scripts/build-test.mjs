// Compila y prueba la historia: npm run typecheck y test:unit. Lint, next build, test:integration y e2e los corre el CI del PR.
// Uso: node .claude/skills/build-test/scripts/build-test.mjs <n> [--raiz <raiz>] [--trabajo <dir>]
// Salida: BUILD SUCCESS | BUILD FAILURE, paso, primer error y clasificación (codigo | entorno).
// Código de salida: 0 éxito, 1 fallo de código, 2 fallo de entorno.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "../../orquestador/scripts/comun.mjs";
import { escribirCampo, rutaEstado } from "../../orquestador/scripts/estado.mjs";

export const PASOS = ["typecheck", "test:unit"];

// Señales de que el fallo no es del código sino del entorno (Node/npm, red, disco).
const ENTORNO = [
  /ENOTFOUND/i, /EAI_AGAIN/i, /ETIMEDOUT/i, /ENOSPC/i,
  /Missing script:/i, /command not found/i, /no se reconoce como un comando/i, /is not recognized as an internal or external command/i,
  /Cannot find module ['"](?:vitest|typescript|next)/i, /npm ERR! code ENOENT/i, /ENOENT: no such file or directory, open .*package\.json/i,
];

export function clasificar(salida) {
  return ENTORNO.some((r) => r.test(salida)) ? "entorno" : "codigo";
}

// Primer error útil: la primera línea que parece un error, o la última línea no vacía.
export function primerError(salida) {
  const lineas = salida.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lineas.find((l) => /error|fail|✗|×|Cannot/i.test(l)) ?? lineas.at(-1) ?? "(sin salida)";
}

export function marcaFecha(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function buildTest({ raiz, log, pasos = PASOS }) {
  if (!existsSync(join(raiz, "package.json"))) {
    return { ok: false, paso: "preparación", clasificacion: "entorno", error: "No hay package.json en la raíz (falta el proyecto de la HU 1b)" };
  }
  for (const paso of pasos) {
    const inicio = Date.now();
    const r = spawnSync("npm", ["run", paso], { cwd: raiz, encoding: "utf8", shell: process.platform === "win32" });
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
  if (!n) fallar("Uso: build-test.mjs <n> [--raiz <raiz>] [--trabajo <dir>]", 2);
  const raiz = o.raiz ?? raizRepo();
  const trabajo = o.trabajo ?? dirTrabajo(n, raiz);
  mkdirSync(trabajo, { recursive: true });
  const fecha = new Date();
  const log = join(trabajo, `build-${marcaFecha(fecha)}.log`);
  writeFileSync(log, `build-test del issue #${n} en ${raiz}\n`);
  const r = buildTest({ raiz, log });
  // puede-commitear.mjs lee estos campos.
  const ruta = rutaEstado(n, trabajo);
  let estado = readFileSync(ruta, "utf8");
  estado = escribirCampo(estado, "Último build", r.ok ? "BUILD SUCCESS" : `BUILD FAILURE (${r.clasificacion})`);
  estado = escribirCampo(estado, "Log del último build", log);
  estado = escribirCampo(estado, "Fecha del último build", fecha.toISOString());
  writeFileSync(ruta, estado);
  if (r.ok) {
    console.log(`BUILD SUCCESS\nPasos: ${PASOS.join(", ")}\nLog: ${log}`);
    process.exit(0);
  }
  console.log(`BUILD FAILURE\nPaso: ${r.paso}\nClasificación: ${r.clasificacion}\nPrimer error: ${r.error}\nLog: ${log}`);
  process.exit(r.clasificacion === "entorno" ? 2 : 1);
}
