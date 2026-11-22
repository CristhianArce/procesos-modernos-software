// Registra en una sola llamada el cierre de un agente o de un paso de la sesión: agrega la fila a
// <trabajo>/agentes-log.md con la hora real, deja la marca del paso en tiempos.md y actualiza estado.md.
// Uso: node .claude/skills/orquestador/scripts/registrar-agente.mjs <n> <paso> <agente> <modelo> <id> <veredicto> [rechazos...] [--trabajo <dir>]
//   <paso>: número del paso, con etiqueta opcional ("4" o "4 G2 (intento 1)"). <id>: id del agente, o - para la sesión.
//   rechazos: texto plano y corto (sin comillas invertidas ni $); el detalle queda en gates.md y verificacion.md.
// La hora la pone el script: el modelo no la conoce. Un CORREGIR o BLOQUEAR deja marca de tiempo, pero no cierra la fase.
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIR_PLANTILLAS, dirTrabajo, esPrincipal, fallar, opciones } from "./comun.mjs";
import { escribirCampo, rutaEstado } from "./estado.mjs";
import { registrarCierre } from "./tiempos.mjs";

const celda = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim() || "—";

export function filaDeAgente({ paso, agente, modelo, id, veredicto, rechazos }, ahora = new Date()) {
  return `| ${ahora.toISOString()} | ${celda(paso)} | ${celda(agente)} | ${celda(modelo)} | ${celda(id === "-" ? "" : id)} | ${celda(veredicto)} | ${celda(rechazos)} |`;
}

export const numeroDePaso = (paso) => String(paso).match(/^\s*(\d+)/)?.[1];
export const cierraFase = (veredicto) => !/^\s*(CORREGIR|BLOQUEAR)/i.test(String(veredicto));

export function registrarAgente(n, datos, trabajo = dirTrabajo(n), ahora = new Date()) {
  const numero = numeroDePaso(datos.paso);
  if (!numero) throw new Error(`El paso debe empezar por su número: ${datos.paso}`);
  mkdirSync(trabajo, { recursive: true });
  const log = join(trabajo, "agentes-log.md");
  if (!existsSync(log)) copyFileSync(join(DIR_PLANTILLAS, "agentes-log.md"), log);
  const previo = readFileSync(log, "utf8");
  const fila = filaDeAgente(datos, ahora);
  appendFileSync(log, `${previo.endsWith("\n") ? "" : "\n"}${fila}\n`);
  const medido = registrarCierre(join(trabajo, "tiempos.md"), numero, ahora);
  if (cierraFase(datos.veredicto)) {
    const ruta = rutaEstado(n, trabajo);
    writeFileSync(ruta, escribirCampo(readFileSync(ruta, "utf8"), "Última fase cerrada", numero));
  }
  return { fila, medido };
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [n, paso, agente, modelo, id, veredicto, ...rechazos] = o._;
  if (!n || !paso || !agente || !modelo || !id || !veredicto) {
    fallar("Uso: registrar-agente.mjs <n> <paso> <agente> <modelo> <id|-> <veredicto> [rechazos...] [--trabajo <dir>]", 2);
  }
  try {
    const r = registrarAgente(n, { paso, agente, modelo, id, veredicto, rechazos: rechazos.join(" ") }, typeof o.trabajo === "string" ? o.trabajo : undefined);
    console.log(`${r.fila}\n${r.medido ? "Marca de tiempo registrada." : "Sin tiempos.md: la corrida no se está midiendo."}`);
  } catch (e) {
    fallar(e.message, 2);
  }
}
