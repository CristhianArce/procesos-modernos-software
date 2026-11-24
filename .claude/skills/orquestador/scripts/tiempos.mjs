// Mide el tiempo de una corrida del orquestador en <trabajo>/tiempos.md (meta: ≤ 5 minutos).
// Uso: node .claude/skills/orquestador/scripts/tiempos.mjs inicio <n> [--desde <fase>] [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/tiempos.mjs cerrar <n> <paso> [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/tiempos.mjs hito <n> "<etiqueta>" [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/tiempos.mjs resumen <n> [--meta <segundos>] [--trabajo <dir>]
// Las marcas las deja registrar-agente.mjs (al registrar cada agente y cada paso de la sesión), así que el orquestador solo invoca
// inicio y resumen. El paso 2 (contexto) no se mide: se lee de context/ y no corre ningún script. estado.mjs también marca al escribir "Última fase cerrada".
// La duración de un paso va del cierre del paso anterior (o del inicio de la corrida) a su propio cierre.
// Un hito es una marca con nombre dentro de un paso (por ejemplo "5 código listo"): no cierra ni mueve ningún paso,
// solo permite ver en qué parte de un paso largo se fue el tiempo.
// Los hitos "<paso> pregunta a la persona" y "<paso> respuesta de la persona" delimitan una ronda de preguntas:
// el resumen suma esas esperas y da el total sin ellas, porque no dependen del flujo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones } from "./comun.mjs";

export const META_SEGUNDOS = 300;
export const NOMBRES = { 1: "Preparar", 2: "Contexto", 3: "Propuesta", 4: "Revisar propuesta", 5: "Implementar", 6: "Verificar", 7: "Corregir", 8: "Commit, PR y evidencias" };
const MARCA = /^\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2}T[^|\s]+)\s*\|\s*$/;
// Un hito lleva una etiqueta de texto ("5 código listo"); una marca de paso es solo un número, así que no se confunden.
const HITO = /^\|\s*(\d+\s+[^|\s][^|]*?|[^\d|\s][^|]*?)\s*\|\s*(\d{4}-\d{2}-\d{2}T[^|\s]+)\s*\|\s*$/;

export const rutaTiempos = (n, trabajo) => join(trabajo ?? dirTrabajo(n), "tiempos.md");

export const lineaDeInicio = (ahora, desde) => `Inicio: ${ahora.toISOString()}${desde ? ` (retoma desde=${desde})` : ""}`;

// Reconstruye el archivo completo: así una marca escrita después de un resumen nunca se pierde.
export function componer(lineaInicio, marcas, resumen = "", hitos = []) {
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
    ...(hitos.length ? ["## Hitos", "", "| Hito | Hora |", "|---|---|", ...hitos.map((h) => `| ${h.etiqueta} | ${h.hora} |`), ""] : []),
    ...(resumen ? [resumen] : []),
  ].join("\n");
}

export function leerMarcas(texto) {
  const lineaInicio = texto.match(/^Inicio: .*$/m)?.[0];
  const inicio = lineaInicio?.match(/^Inicio: (\S+)/)?.[1];
  const marcas = [];
  const hitos = [];
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(MARCA);
    if (m) {
      marcas.push({ paso: Number(m[1]), hora: m[2] });
      continue;
    }
    const h = linea.match(HITO);
    if (h) hitos.push({ etiqueta: h[1], hora: h[2] });
  }
  return { lineaInicio, inicio, marcas, hitos };
}

// Agrega la marca de cierre de un paso. Si la corrida no se está midiendo (no hay tiempos.md), no hace nada.
export function registrarCierre(ruta, paso, ahora = new Date()) {
  if (!existsSync(ruta) || !/^\d+$/.test(String(paso))) return false;
  const { lineaInicio, inicio, marcas, hitos } = leerMarcas(readFileSync(ruta, "utf8"));
  if (!inicio) return false;
  writeFileSync(ruta, componer(lineaInicio, [...marcas, { paso: Number(paso), hora: ahora.toISOString() }], "", hitos));
  return true;
}

// Agrega un hito con nombre. Si la corrida no se está midiendo, no hace nada.
export function registrarHito(ruta, etiqueta, ahora = new Date()) {
  const nombre = String(etiqueta ?? "").replace(/\s+/g, " ").trim();
  if (!existsSync(ruta) || !nombre || nombre.includes("|")) return false;
  const { lineaInicio, inicio, marcas, hitos } = leerMarcas(readFileSync(ruta, "utf8"));
  if (!inicio) return false;
  writeFileSync(ruta, componer(lineaInicio, marcas, "", [...hitos, { etiqueta: nombre, hora: ahora.toISOString() }]));
  return true;
}

// Cuánto pasó desde el evento anterior: el último hito, o la última marca de paso (o el inicio) si no hay hito antes.
export function duracionesHitos(inicio, marcas, hitos) {
  let previo = Date.parse(inicio);
  return hitos.map(({ etiqueta, hora }) => {
    const t = Date.parse(hora);
    for (const m of marcas) if (Date.parse(m.hora) < t) previo = Math.max(previo, Date.parse(m.hora));
    const fila = { etiqueta, segundos: Math.max(0, (t - previo) / 1000) };
    previo = t;
    return fila;
  });
}

// Espera de la persona: suma, en orden, de cada par de hitos "… pregunta a la persona" → "… respuesta de la persona".
// Una pregunta sin respuesta (la corrida se cortó) no suma. El orquestador deja los dos hitos alrededor de cada ronda de preguntas.
export const HITO_PREGUNTA = /pregunta a la persona/i;
export const HITO_RESPUESTA = /respuesta de la persona/i;
export function esperaPersona(hitos) {
  let segundos = 0;
  let rondas = 0;
  let pregunta = null;
  for (const { etiqueta, hora } of hitos) {
    if (HITO_PREGUNTA.test(etiqueta)) pregunta = Date.parse(hora);
    else if (HITO_RESPUESTA.test(etiqueta) && pregunta !== null) {
      segundos += Math.max(0, (Date.parse(hora) - pregunta) / 1000);
      rondas += 1;
      pregunta = null;
    }
  }
  return { segundos, rondas };
}

const fmt = (s) => {
  const t = Math.round(s);
  return `${Math.floor(t / 60)} min ${String(t % 60).padStart(2, "0")} s`;
};

// Duración por paso y total. El paso en curso (después del último cerrado) se cierra con "ahora".
export function calcular(inicio, marcas, ahora, meta = META_SEGUNDOS) {
  const t0 = Date.parse(inicio);
  const fin = ahora.getTime();
  const pasos = [];
  let previo = t0;
  for (const { paso, hora } of marcas) {
    const t = Date.parse(hora);
    pasos.push({ paso, nombre: NOMBRES[paso] ?? `Paso ${paso}`, segundos: Math.max(0, (t - previo) / 1000) });
    previo = t;
  }
  const ultimo = marcas.at(-1)?.paso ?? 0;
  if (fin > previo && ultimo < 8) {
    // Tras verificar (6) o corregir (7), lo que queda hasta el resumen es el paso 8: el 7 es opcional.
    const paso = ultimo >= 6 ? 8 : ultimo + 1;
    pasos.push({ paso, nombre: `${NOMBRES[paso] ?? `Paso ${paso}`} (hasta el resumen)`, segundos: (fin - previo) / 1000 });
  }
  const total = Math.max(0, (fin - t0) / 1000);
  return { pasos, total, meta, dentro: total <= meta };
}

export function resumenMarkdown(r, hitos = [], espera = { segundos: 0, rondas: 0 }) {
  const sinEspera = Math.max(0, r.total - espera.segundos);
  return [
    "## Resumen",
    "",
    "| # | Paso | Duración |",
    "|---|---|---|",
    ...r.pasos.map((p) => `| ${p.paso} | ${p.nombre} | ${fmt(p.segundos)} |`),
    "",
    ...(hitos.length ? ["Hitos (desde el hito o el cierre de paso anterior):", "", "| Hito | Duración |", "|---|---|", ...hitos.map((h) => `| ${h.etiqueta} | ${fmt(h.segundos)} |`), ""] : []),
    `Total: ${fmt(r.total)} (${Math.round(r.total)} s). Meta: ≤ ${fmt(r.meta)}. ${r.dentro ? "Dentro de la meta." : `**Fuera de la meta por ${fmt(r.total - r.meta)}.**`}`,
    ...(espera.rondas
      ? [
          "",
          `Espera de la persona: ${fmt(espera.segundos)} en ${espera.rondas} ${espera.rondas === 1 ? "ronda" : "rondas"} de preguntas. Total sin la espera: ${fmt(sinEspera)} (${sinEspera <= r.meta ? "dentro" : "fuera"} de la meta).`,
        ]
      : []),
    "",
  ].join("\n");
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [accion, n, paso] = o._;
  if (!["inicio", "cerrar", "hito", "resumen"].includes(accion) || !n) {
    fallar("Uso: tiempos.mjs inicio <n> [--desde <fase>] | cerrar <n> <paso> | hito <n> <etiqueta> | resumen <n> [--meta <s>] [--trabajo <dir>]", 2);
  }
  const ruta = rutaTiempos(n, o.trabajo);
  if (accion === "inicio") {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, componer(lineaDeInicio(new Date(), typeof o.desde === "string" ? o.desde : undefined), []));
    console.log(`Inicio registrado en ${ruta}`);
  } else if (!existsSync(ruta)) {
    fallar(`No hay ${ruta}: corre primero "tiempos.mjs inicio ${n}"`, 3);
  } else {
    const { lineaInicio, inicio, marcas, hitos } = leerMarcas(readFileSync(ruta, "utf8"));
    if (!inicio) fallar(`Falta la línea "Inicio:" en ${ruta}`, 3);
    if (accion === "cerrar") {
      if (!registrarCierre(ruta, paso)) fallar("cerrar espera el número del paso", 2);
    } else if (accion === "hito") {
      if (!registrarHito(ruta, o._.slice(2).join(" "))) fallar("hito espera una etiqueta de texto sin barras verticales", 2);
    } else {
      const meta = o.meta !== undefined ? Number(o.meta) : META_SEGUNDOS;
      const md = resumenMarkdown(calcular(inicio, marcas, new Date(), meta), duracionesHitos(inicio, marcas, hitos), esperaPersona(hitos));
      writeFileSync(ruta, componer(lineaInicio, marcas, md, hitos));
      console.log(md);
    }
  }
}
