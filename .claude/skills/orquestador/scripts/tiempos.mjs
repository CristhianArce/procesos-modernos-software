// Mide el tiempo de una corrida del orquestador en <trabajo>/tiempos.md (meta: ≤ 5 minutos).
// Uso: node .claude/skills/orquestador/scripts/tiempos.mjs inicio <n> [--desde <fase>] [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/tiempos.mjs cerrar <n> <paso> [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/tiempos.mjs resumen <n> [--meta <segundos>] [--trabajo <dir>]
// Las marcas las dejan registrar-agente.mjs (al registrar cada agente y cada paso de la sesión) y contexto.mjs (paso 2),
// así que el orquestador solo invoca inicio y resumen. estado.mjs también marca al escribir "Última fase cerrada".
// La duración de un paso va del cierre del paso anterior (o del inicio de la corrida) a su propio cierre.
// Espera de la persona (preguntas del paso 3): `tiempos.mjs espera <n> inicio` antes de preguntar y `espera <n> fin` al recibir la
// respuesta. El resumen la resta y muestra el tiempo activo; la meta se sigue comparando con el total.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones } from "./comun.mjs";

export const META_SEGUNDOS = 300;
export const NOMBRES = { 1: "Preparar", 2: "Contexto", 3: "Propuesta", 4: "Revisar propuesta", 5: "Implementar", 6: "Verificar", 7: "Corregir", 8: "Commit, PR y evidencias" };
const MARCA = /^\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2}T[^|\s]+)\s*\|\s*$/;
const ESPERA = /^\|\s*(\d{4}-\d{2}-\d{2}T[^|\s]+)\s*\|\s*(\d{4}-\d{2}-\d{2}T[^|\s]+|—)\s*\|\s*$/;

export const rutaTiempos = (n, trabajo) => join(trabajo ?? dirTrabajo(n), "tiempos.md");

export const lineaDeInicio = (ahora, desde) => `Inicio: ${ahora.toISOString()}${desde ? ` (retoma desde=${desde})` : ""}`;

// Reconstruye el archivo completo: así una marca escrita después de un resumen nunca se pierde.
export function componer(lineaInicio, marcas, resumen = "", esperas = []) {
  return [
    "# Tiempos de la corrida",
    "",
    lineaInicio,
    "",
    "## Marcas",
    "",
    "| Paso cerrado | Hora |",
    "|---|---|",
    ...marcas.map((m) => `| ${m.paso} | ${m.hora} |`),
    "",
    ...(esperas.length
      ? ["## Esperas de la persona", "", "| Inicio | Fin |", "|---|---|", ...esperas.map((e) => `| ${e.inicio} | ${e.fin ?? "—"} |`), ""]
      : []),
    ...(resumen ? [resumen] : []),
  ].join("\n");
}

export function leerMarcas(texto) {
  const lineaInicio = texto.match(/^Inicio: .*$/m)?.[0];
  const inicio = lineaInicio?.match(/^Inicio: (\S+)/)?.[1];
  const marcas = [];
  const esperas = [];
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(MARCA);
    if (m) marcas.push({ paso: Number(m[1]), hora: m[2] });
    const e = linea.match(ESPERA);
    if (e) esperas.push({ inicio: e[1], fin: e[2] === "—" ? undefined : e[2] });
  }
  return { lineaInicio, inicio, marcas, esperas };
}

// Abre ("inicio") o cierra ("fin") una espera de la persona. Si la corrida no se mide, no hace nada.
export function registrarEspera(ruta, momento, ahora = new Date()) {
  if (!existsSync(ruta) || !["inicio", "fin"].includes(momento)) return false;
  const { lineaInicio, inicio, marcas, esperas } = leerMarcas(readFileSync(ruta, "utf8"));
  if (!inicio) return false;
  const abierta = esperas.findLastIndex((e) => !e.fin);
  if (momento === "inicio") {
    if (abierta === -1) esperas.push({ inicio: ahora.toISOString() });
  } else if (abierta !== -1) {
    esperas[abierta].fin = ahora.toISOString();
  }
  writeFileSync(ruta, componer(lineaInicio, marcas, "", esperas));
  return true;
}

// Agrega la marca de cierre de un paso. Si la corrida no se está midiendo (no hay tiempos.md), no hace nada.
export function registrarCierre(ruta, paso, ahora = new Date()) {
  if (!existsSync(ruta) || !/^\d+$/.test(String(paso))) return false;
  const { lineaInicio, inicio, marcas, esperas } = leerMarcas(readFileSync(ruta, "utf8"));
  if (!inicio) return false;
  writeFileSync(ruta, componer(lineaInicio, [...marcas, { paso: Number(paso), hora: ahora.toISOString() }], "", esperas));
  return true;
}

// Segundos de espera de la persona dentro de [desde, hasta] (una espera abierta cuenta hasta `ahora`).
const solape = (esperas, desde, hasta, ahora) =>
  esperas.reduce((s, e) => {
    const a = Math.max(desde, Date.parse(e.inicio));
    const b = Math.min(hasta, e.fin ? Date.parse(e.fin) : ahora);
    return s + Math.max(0, b - a) / 1000;
  }, 0);

const fmt = (s) => {
  const t = Math.round(s);
  return `${Math.floor(t / 60)} min ${String(t % 60).padStart(2, "0")} s`;
};

// Duración por paso y total. El paso en curso (después del último cerrado) se cierra con "ahora".
export function calcular(inicio, marcas, ahora, meta = META_SEGUNDOS, esperas = []) {
  const t0 = Date.parse(inicio);
  const fin = ahora.getTime();
  const pasos = [];
  let previo = t0;
  for (const { paso, hora } of marcas) {
    const t = Date.parse(hora);
    pasos.push({ paso, nombre: NOMBRES[paso] ?? `Paso ${paso}`, segundos: Math.max(0, (t - previo) / 1000), espera: solape(esperas, previo, t, fin) });
    previo = t;
  }
  const ultimo = marcas.at(-1)?.paso ?? 0;
  if (fin > previo && ultimo < 8) {
    // Tras verificar (6) o corregir (7), lo que queda hasta el resumen es el paso 8: el 7 es opcional.
    const paso = ultimo >= 6 ? 8 : ultimo + 1;
    pasos.push({ paso, nombre: `${NOMBRES[paso] ?? `Paso ${paso}`} (hasta el resumen)`, segundos: (fin - previo) / 1000, espera: solape(esperas, previo, fin, fin) });
  }
  const total = Math.max(0, (fin - t0) / 1000);
  const espera = solape(esperas, t0, fin, fin);
  return { pasos, total, espera, activo: total - espera, meta, dentro: total <= meta };
}

export function resumenMarkdown(r) {
  const conEspera = r.espera > 0;
  return [
    "## Resumen",
    "",
    conEspera ? "| # | Paso | Duración | Espera de la persona |" : "| # | Paso | Duración |",
    conEspera ? "|---|---|---|---|" : "|---|---|---|",
    ...r.pasos.map((p) => `| ${p.paso} | ${p.nombre} | ${fmt(p.segundos)} |${conEspera ? ` ${p.espera > 0 ? fmt(p.espera) : "—"} |` : ""}`),
    "",
    `Total: ${fmt(r.total)} (${Math.round(r.total)} s). Meta: ≤ ${fmt(r.meta)}. ${r.dentro ? "Dentro de la meta." : `**Fuera de la meta por ${fmt(r.total - r.meta)}.**`}`,
    ...(conEspera ? ["", `Tiempo activo (sin la espera de la persona): ${fmt(r.activo)} (${Math.round(r.activo)} s). Espera de la persona: ${fmt(r.espera)}.`] : []),
    "",
  ].join("\n");
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [accion, n, paso] = o._;
  if (!["inicio", "cerrar", "resumen", "espera"].includes(accion) || !n) {
    fallar("Uso: tiempos.mjs inicio <n> [--desde <fase>] | cerrar <n> <paso> | espera <n> inicio|fin | resumen <n> [--meta <s>] [--trabajo <dir>]", 2);
  }
  const ruta = rutaTiempos(n, o.trabajo);
  if (accion === "inicio") {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, componer(lineaDeInicio(new Date(), typeof o.desde === "string" ? o.desde : undefined), []));
    console.log(`Inicio registrado en ${ruta}`);
  } else if (!existsSync(ruta)) {
    fallar(`No hay ${ruta}: corre primero "tiempos.mjs inicio ${n}"`, 3);
  } else {
    const { lineaInicio, inicio, marcas, esperas } = leerMarcas(readFileSync(ruta, "utf8"));
    if (!inicio) fallar(`Falta la línea "Inicio:" en ${ruta}`, 3);
    if (accion === "cerrar") {
      if (!registrarCierre(ruta, paso)) fallar("cerrar espera el número del paso", 2);
    } else if (accion === "espera") {
      if (!registrarEspera(ruta, paso)) fallar("espera pide inicio o fin", 2);
    } else {
      const meta = o.meta !== undefined ? Number(o.meta) : META_SEGUNDOS;
      const md = resumenMarkdown(calcular(inicio, marcas, new Date(), meta, esperas));
      writeFileSync(ruta, componer(lineaInicio, marcas, md, esperas));
      console.log(md);
    }
  }
}
