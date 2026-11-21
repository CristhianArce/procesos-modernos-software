// Extrae el puerto de la salida de `docker compose port <servicio> <puerto>`.
// Uso: docker compose -p issue-9 port db 5432 | node .claude/skills/orquestador/scripts/puerto.mjs
//      node .claude/skills/orquestador/scripts/puerto.mjs "0.0.0.0:49153"
import { readFileSync } from "node:fs";
import { esPrincipal, fallar } from "./comun.mjs";

// Acepta "0.0.0.0:49153", "[::]:49153" o varias líneas (toma la primera válida).
export function extraerPuerto(salida) {
  for (const linea of String(salida).split(/\r?\n/)) {
    const m = linea.trim().match(/^(?:\[[0-9a-fA-F:]*\]|[\d.]+|[\w.-]+):(\d{1,5})$/);
    if (m) {
      const p = Number(m[1]);
      if (p > 0 && p < 65536) return p;
    }
  }
  return null;
}

if (esPrincipal(import.meta.url)) {
  const entrada = process.argv[2] ?? readFileSync(0, "utf8");
  const p = extraerPuerto(entrada);
  if (p === null) fallar(`No se encontró un puerto en: ${entrada.trim() || "(vacío)"}`);
  console.log(p);
}
