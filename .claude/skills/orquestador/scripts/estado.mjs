// Lee y actualiza campos de <trabajo>/estado.md (tabla | Campo | Valor |).
// Uso: node .claude/skills/orquestador/scripts/estado.mjs leer <n> <campo> [--trabajo <dir>]
//      node .claude/skills/orquestador/scripts/estado.mjs escribir <n> <campo> <valor> [--trabajo <dir>]
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DIR_PLANTILLAS, dirTrabajo, esPrincipal, fallar, opciones } from "./comun.mjs";
import { registrarCierre } from "./tiempos.mjs";

const FILA = /^\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|\s*$/;

export function leerCampo(texto, campo) {
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(FILA);
    if (m && m[1] === campo) return m[2];
  }
  return undefined;
}

export function escribirCampo(texto, campo, valor) {
  const limpio = String(valor).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const lineas = texto.split(/\r?\n/);
  const i = lineas.findIndex((l) => l.match(FILA)?.[1] === campo);
  if (i >= 0) {
    lineas[i] = `| ${campo} | ${limpio} |`;
  } else {
    let ultima = -1;
    lineas.forEach((l, k) => { if (FILA.test(l)) ultima = k; });
    lineas.splice(ultima + 1, 0, `| ${campo} | ${limpio} |`);
  }
  return lineas.join("\n");
}

export function rutaEstado(n, trabajo) {
  const dir = trabajo ?? dirTrabajo(n);
  const ruta = join(dir, "estado.md");
  if (!existsSync(ruta)) {
    mkdirSync(dir, { recursive: true });
    copyFileSync(join(DIR_PLANTILLAS, "estado.md"), ruta);
  }
  return ruta;
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [accion, n, campo, ...resto] = o._;
  if (!["leer", "escribir"].includes(accion) || !n || !campo) {
    fallar("Uso: estado.mjs leer <n> <campo> | escribir <n> <campo> <valor> [--trabajo <dir>]", 2);
  }
  const ruta = rutaEstado(n, o.trabajo);
  const texto = readFileSync(ruta, "utf8");
  if (accion === "leer") {
    const v = leerCampo(texto, campo);
    if (v === undefined) fallar(`Campo no encontrado: ${campo}`, 3);
    console.log(v);
  } else {
    writeFileSync(ruta, escribirCampo(texto, campo, resto.join(" ")));
    // Cerrar un paso también deja su hora en tiempos.md (si la corrida se está midiendo).
    if (campo === "Última fase cerrada") registrarCierre(join(dirname(ruta), "tiempos.md"), resto[0]);
    console.log(`${campo} = ${resto.join(" ")}`);
  }
}
