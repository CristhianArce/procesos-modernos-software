// Mide el tiempo de una corrida del orquestador en <trabajo>/tiempos.md (meta: ≤ 5 minutos).
// Uso: node .claude/skills/orquestador/scripts/tiempos.mjs inicio <n> [--desde <fase>] [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/tiempos.mjs cerrar <n> <paso> [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/tiempos.mjs resumen <n> [--meta <segundos>] [--trabajo <dir>]
// "cerrar" lo llama estado.mjs al escribir "Última fase cerrada", así que el orquestador solo invoca inicio y resumen.
// La duración de un paso va del cierre del paso anterior (o del inicio de la corrida) a su propio cierre.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones } from "./comun.mjs";

export const META_SEGUNDOS = 300;
export const NOMBRES = { 1: "Preparar", 2: "Contexto", 3: "Propuesta", 4: "G2", 5: "Implementar", 6: "Verificar", 7: "Corregir", 8: "Commit, PR y evidencias" };
const MARCA = /^\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2}T[^|\s]+)\s*\|\s*$/;

export const rutaTiempos = (n, trabajo) => join(trabajo ?? dirTrabajo(n), "tiempos.md");

export const lineaDeInicio = (ahora, desde) => `Inicio: ${ahora.toISOString()}${desde ? ` (retoma desde=${desde})` : ""}`;

// Reconstruye el archivo completo: así una marca escrita después de un resumen nunca se pierde.
export function componer(lineaInicio, marcas, resumen = "") {
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
    ...(resumen ? [resumen] : []),
  ].join("\n");
}

export function leerMarcas(texto) {
  const lineaInicio = texto.match(/^Inicio: .*$/m)?.[0];
  const inicio = lineaInicio?.match(/^Inicio: (\S+)/)?.[1];
  const marcas = [];
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(MARCA);
    if (m) marcas.push({ paso: Number(m[1]), hora: m[2] });
  }
  return { lineaInicio, inicio, marcas };
}

// Agrega la marca de cierre de un paso. Si la corrida no se está midiendo (no hay tiempos.md), no hace nada.
export function registrarCierre(ruta, paso, ahora = new Date()) {
  if (!existsSync(ruta) || !/^\d+$/.test(String(paso))) return false;
  const { lineaInicio, inicio, marcas } = leerMarcas(readFileSync(ruta, "utf8"));
  if (!inicio) return false;
  writeFileSync(ruta, componer(lineaInicio, [...marcas, { paso: Number(paso), hora: ahora.toISOString() }]));
  return true;
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
    const paso = ultimo + 1;
    pasos.push({ paso, nombre: `${NOMBRES[paso] ?? `Paso ${paso}`} (hasta el resumen)`, segundos: (fin - previo) / 1000 });
  }
  const total = Math.max(0, (fin - t0) / 1000);
  return { pasos, total, meta, dentro: total <= meta };
}

export function resumenMarkdown(r) {
  return [
    "## Resumen",
    "",
    "| # | Paso | Duración |",
    "|---|---|---|",
    ...r.pasos.map((p) => `| ${p.paso} | ${p.nombre} | ${fmt(p.segundos)} |`),
    "",
    `Total: ${fmt(r.total)} (${Math.round(r.total)} s). Meta: ≤ ${fmt(r.meta)}. ${r.dentro ? "Dentro de la meta." : `**Fuera de la meta por ${fmt(r.total - r.meta)}.**`}`,
    "",
  ].join("\n");
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [accion, n, paso] = o._;
  if (!["inicio", "cerrar", "resumen"].includes(accion) || !n) {
    fallar("Uso: tiempos.mjs inicio <n> [--desde <fase>] | cerrar <n> <paso> | resumen <n> [--meta <s>] [--trabajo <dir>]", 2);
  }
  const ruta = rutaTiempos(n, o.trabajo);
  if (accion === "inicio") {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, componer(lineaDeInicio(new Date(), typeof o.desde === "string" ? o.desde : undefined), []));
    console.log(`Inicio registrado en ${ruta}`);
  } else if (!existsSync(ruta)) {
    fallar(`No hay ${ruta}: corre primero "tiempos.mjs inicio ${n}"`, 3);
  } else {
    const { lineaInicio, inicio, marcas } = leerMarcas(readFileSync(ruta, "utf8"));
    if (!inicio) fallar(`Falta la línea "Inicio:" en ${ruta}`, 3);
    if (accion === "cerrar") {
      if (!registrarCierre(ruta, paso)) fallar("cerrar espera el número del paso", 2);
    } else {
      const meta = o.meta !== undefined ? Number(o.meta) : META_SEGUNDOS;
      const md = resumenMarkdown(calcular(inicio, marcas, new Date(), meta));
      writeFileSync(ruta, componer(lineaInicio, marcas, md));
      console.log(md);
    }
  }
}
