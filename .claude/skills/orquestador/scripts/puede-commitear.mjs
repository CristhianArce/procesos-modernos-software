// Decide si el skill commit puede commitear: el último build de estado.md debe ser BUILD SUCCESS
// y posterior a la última modificación de las rutas a commitear. Si todas las rutas están bajo evidencias/, no exige build.
// Uso: node .claude/skills/orquestador/scripts/puede-commitear.mjs <n> <ruta>... [--trabajo <dir>] [--raiz <raiz>]
// Código de salida: 0 puede, 1 no puede (motivo en la salida).
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";
import { leerCampo } from "./estado.mjs";

export function decidir({ estado, rutas, mtimes }) {
  if (rutas.length === 0) return { puede: false, motivo: "No hay rutas para commitear" };
  if (rutas.every((r) => r.replace(/\\/g, "/").startsWith("evidencias/"))) return { puede: true, motivo: "Solo evidencias: no exige build" };
  const build = leerCampo(estado, "Último build") ?? "";
  if (build !== "BUILD SUCCESS") return { puede: false, motivo: `El último build no está en verde: "${build || "sin build"}"` };
  const fecha = Date.parse(leerCampo(estado, "Fecha del último build") ?? "");
  if (Number.isNaN(fecha)) return { puede: false, motivo: "estado.md no tiene la fecha del último build" };
  const ultima = Math.max(...mtimes);
  if (ultima > fecha) return { puede: false, motivo: "Hay cambios posteriores al último build: corre build-test de nuevo" };
  return { puede: true, motivo: "Build verde y posterior a la última edición" };
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [n, ...rutas] = o._;
  if (!n) fallar("Uso: puede-commitear.mjs <n> <ruta>... [--trabajo <dir>] [--raiz <raiz>]", 2);
  const raiz = o.raiz ?? raizRepo();
  const ruta = join(o.trabajo ?? dirTrabajo(n, raiz), "estado.md");
  const estado = existsSync(ruta) ? readFileSync(ruta, "utf8") : "";
  const mtimes = rutas.map((r) => (existsSync(join(raiz, r)) ? statSync(join(raiz, r)).mtimeMs : 0));
  const d = decidir({ estado, rutas, mtimes });
  console.log(`${d.puede ? "PUEDE COMMITEAR" : "NO COMMITEAR"}: ${d.motivo}`);
  process.exit(d.puede ? 0 : 1);
}
