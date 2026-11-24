// Copia la evidencia de <trabajo> a evidencias/issue-<n>/ y genera agentes.md desde agentes-log.md.
// Uso: node .claude/skills/orquestador/scripts/copiar-evidencias.mjs <n> [--trabajo <dir>] [--destino <dir>]
// No copia logs, capturas ni nada que no esté en la lista (los logs pueden tener datos del .env).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";

export const ARCHIVOS_EVIDENCIA = ["issue.md", "preguntas.md", "decisiones.md", "gates.md", "verificacion.md", "trazabilidad.md", "tiempos.md"];

// Convierte las filas de agentes-log.md al formato de agentes.md.
export function agentesDesdeLog(textoLog, n) {
  const filas = [];
  for (const linea of textoLog.split(/\r?\n/)) {
    if (!linea.startsWith("|") || /^\|\s*-/.test(linea) || /Fecha-hora/.test(linea)) continue;
    // Una barra escapada (\|) es texto de la celda, no un separador.
    const c = linea.split(/(?<!\\)\|/).slice(1, -1).map((s) => s.trim());
    if (c.length < 7) continue;
    const [, paso, agente, modelo, id, veredicto, rechazos] = c;
    filas.push(`| ${paso} | ${agente} | ${modelo} | ${id} | ${veredicto} | ${rechazos} |`);
  }
  return [
    `# Agentes del issue #${n}`,
    "",
    "| Paso | Agente | Modelo | Id del agente | Resultado | Rechazos y corrección |",
    "|---|---|---|---|---|---|",
    ...filas,
    "",
  ].join("\n");
}

export function copiarEvidencias(n, trabajo, destino) {
  if (!existsSync(trabajo)) throw new Error(`No existe <trabajo>: ${trabajo}`);
  mkdirSync(destino, { recursive: true });
  const copiados = [];
  for (const a of ARCHIVOS_EVIDENCIA) {
    if (existsSync(join(trabajo, a))) {
      copyFileSync(join(trabajo, a), join(destino, a));
      copiados.push(a);
    }
  }
  const log = join(trabajo, "agentes-log.md");
  if (existsSync(log)) {
    writeFileSync(join(destino, "agentes.md"), agentesDesdeLog(readFileSync(log, "utf8"), n));
    copiados.push("agentes.md");
  }
  return copiados;
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const n = o._[0];
  if (!n) fallar("Uso: copiar-evidencias.mjs <n> [--trabajo <dir>] [--destino <dir>]", 2);
  const raiz = raizRepo();
  const copiados = copiarEvidencias(n, o.trabajo ?? dirTrabajo(n, raiz), o.destino ?? join(raiz, "evidencias", `issue-${n}`));
  console.log(`Copiados a evidencias/issue-${n}/: ${copiados.join(", ")}`);
}
