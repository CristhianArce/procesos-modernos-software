// Prepara la BD de la corrida para las pruebas de integración: la levanta con docker compose, aplica las
// migraciones con Flyway (incluida la nueva de la historia), arma DATABASE_URL con el puerto efímero y carga las semillas.
// Así ni el orquestador ni la persona arman DATABASE_URL a mano (Claude Code no puede leer .env).
// Cada issue usa su propio proyecto de compose (flujo-issue-<n>): es una BD local y desechable, nunca una compartida,
// y no toca la BD de desarrollo de la persona (proyecto "tablero"). Si una migración ya aplicada cambió (la historia
// corrigió la suya), la BD de la corrida se recrea una vez. Para borrarla: docker compose -p flujo-issue-<n> down -v.
// Si DATABASE_URL ya viene en el entorno (CI, o la persona la exportó) o la raíz no tiene docker-compose.yml, no hace nada.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extraerPuerto } from "../../orquestador/scripts/puerto.mjs";

const POSTGRES = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"];
// docker compose interpola el archivo entero: estas variables son de la app, pero sin valor ni db ni flyway arrancan.
const SOLO_PARA_INTERPOLAR = ["SESSION_SECRET", "METRICS_TOKEN"];
// Flyway se niega a migrar si una migración ya aplicada cambió o desapareció: se arregla recreando la BD de la corrida.
const BD_DESFASADA = /checksum mismatch|Validate failed|not resolved locally/i;

// Variables de un .env como las lee docker compose: CLAVE=valor, comillas opcionales y comentario al final de línea.
export function leerEnv(texto) {
  const env = {};
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const crudo = m[2];
    const comillas = crudo.match(/^(['"])(.*?)\1/);
    env[m[1]] = comillas ? comillas[2] : crudo.replace(/\s+#.*$/, "").trim();
  }
  return env;
}

export function urlBd(env, puerto) {
  const faltan = POSTGRES.filter((k) => !env[k]);
  if (faltan.length) throw new Error(`Faltan en .env (o en el entorno): ${faltan.join(", ")}`);
  const c = encodeURIComponent;
  return `postgres://${c(env.POSTGRES_USER)}:${c(env.POSTGRES_PASSWORD)}@localhost:${puerto}/${c(env.POSTGRES_DB)}`;
}

export const usaCompose = (raiz, env = process.env) => !env.DATABASE_URL && existsSync(join(raiz, "docker-compose.yml"));
export const proyectoDe = (n) => `flujo-issue-${n}`;

// Credenciales: las de .env, y encima las del entorno (la misma precedencia que docker compose).
export function credenciales(raiz, entorno = process.env) {
  const archivo = existsSync(join(raiz, ".env")) ? leerEnv(readFileSync(join(raiz, ".env"), "utf8")) : {};
  const env = { ...archivo };
  for (const k of [...POSTGRES, ...SOLO_PARA_INTERPOLAR]) if (entorno[k]) env[k] = entorno[k];
  return env;
}

function correr(raiz, log, comando, args, env) {
  const inicio = Date.now();
  const r = spawnSync(comando, args, { cwd: raiz, encoding: "utf8", shell: process.platform === "win32", env });
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? String(r.error) : ""}`;
  if (log) appendFileSync(log, `\n===== ${comando} ${args.join(" ")} (código ${r.status}, ${Date.now() - inicio} ms) =====\n${salida}`);
  return { ok: r.status === 0, salida, stdout: r.stdout ?? "" };
}

// Devuelve { ok: true, url } o { ok: false, paso, error, salida, migracion? }. La URL nunca se escribe en el log.
// migrar: false solo comprueba que la BD levanta y que hay credenciales (precondición rápida).
export function prepararBd(raiz, log, { n, migrar = true } = {}) {
  const cred = credenciales(raiz);
  try {
    urlBd(cred, 0);
  } catch (e) {
    return { ok: false, paso: "bd: .env", error: existsSync(join(raiz, ".env")) ? e.message : `Falta .env en la raíz (cópialo de .env.example). ${e.message}`, salida: "" };
  }
  const env = { ...process.env };
  for (const k of SOLO_PARA_INTERPOLAR) if (!cred[k]) env[k] = "solo-para-interpolar-el-compose";
  const compose = (...args) => correr(raiz, log, "docker", ["compose", "-p", proyectoDe(n), ...args], env);
  const levantar = () => compose("up", "-d", "--wait", "db");

  const arriba = levantar();
  if (!arriba.ok) return { ok: false, paso: "bd: docker compose up", error: "No se pudo levantar la BD de la corrida (¿Docker está en marcha?)", salida: arriba.salida };
  if (!migrar) return leerUrl(compose, cred);

  let migracion = compose("run", "--rm", "flyway", "migrate");
  if (!migracion.ok && BD_DESFASADA.test(migracion.salida)) {
    // La BD es de esta corrida: se puede recrear sin perder nada que no salga de db/migration y db/seed.
    compose("down", "-v");
    const otraVez = levantar();
    if (!otraVez.ok) return { ok: false, paso: "bd: docker compose up", error: "No se pudo recrear la BD de la corrida", salida: otraVez.salida };
    migracion = compose("run", "--rm", "flyway", "migrate");
  }
  if (!migracion.ok) return { ok: false, paso: "bd: flyway migrate", error: "Flyway no pudo aplicar las migraciones", salida: migracion.salida, migracion: true };

  const bd = leerUrl(compose, cred);
  if (!bd.ok) return bd;
  const paquete = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8"));
  if (paquete.scripts?.seed) {
    const semilla = correr(raiz, log, "npm", ["run", "seed"], { ...process.env, DATABASE_URL: bd.url });
    if (!semilla.ok) return { ok: false, paso: "bd: npm run seed", error: "No se pudieron cargar las semillas", salida: semilla.salida, migracion: true };
  }
  return bd;
}

function leerUrl(compose, cred) {
  const puerto = extraerPuerto(compose("port", "db", "5432").stdout);
  if (puerto === null) return { ok: false, paso: "bd: docker compose port", error: "No se pudo leer el puerto de la BD", salida: "" };
  return { ok: true, url: urlBd(cred, puerto) };
}
