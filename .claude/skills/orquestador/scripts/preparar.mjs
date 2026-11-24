// Parte mecánica del paso 1: lee el issue, bloquea si ya está resuelto, crea o reutiliza la rama y deja los archivos base en <trabajo>.
// El juicio (revisar los criterios y escribir las preguntas de negocio) lo hace el agente preparador con la salida de este script.
// Uso: node .claude/skills/orquestador/scripts/preparar.mjs <n> <base> [--trabajo <dir>] [--raiz <raiz>]
// Salida: JSON en una línea. Código de salida: 0 OK, 3 BLOQUEAR (el motivo va en "motivo"), 2 uso o entorno.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIR_PLANTILLAS, dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";

export function slugDeTitulo(titulo, maxPalabras = 5) {
  return String(titulo)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    .split(" ").filter(Boolean).slice(0, maxPalabras).join("-") || "historia";
}

// Cambios en archivos con seguimiento (los sin seguimiento, p. ej. .flujo/, no cuentan).
export const hayCambiosConSeguimiento = (porcelain) =>
  porcelain.split(/\r?\n/).some((l) => l.trim() && !l.startsWith("??"));

const CA = /^\s*(?:[-*]\s*)?\**\s*CA-(\d+)\s*[:.)]?\**\s*[:.)]?\s*(.+?)\s*$/;

// Sección `## <titulo>` del cuerpo, hasta el siguiente `## `.
export function seccion(cuerpo, patron) {
  const ls = String(cuerpo).split(/\r?\n/);
  const i = ls.findIndex((l) => /^##\s/.test(l) && patron.test(l));
  if (i < 0) return undefined;
  const fin = ls.findIndex((l, k) => k > i && /^##\s/.test(l));
  return ls.slice(i + 1, fin < 0 ? undefined : fin).join("\n").trim();
}

// Criterios de aceptación: los CA-n que trae el issue (texto literal) o, si hay una lista sin numerar, la lista numerada.
export function extraerCriterios(cuerpo) {
  const sec = seccion(cuerpo, /criterios/i);
  if (!sec) return { criterios: [], numerados: false };
  const conCA = sec.split(/\r?\n/).map((l) => l.match(CA)).filter(Boolean).map((m) => ({ id: `CA-${m[1]}`, texto: m[2] }));
  if (conCA.length) return { criterios: conCA, numerados: true };
  const lista = sec.split(/\r?\n/).map((l) => l.match(/^\s*(?:[-*]|\d+[.)])\s+(.+?)\s*$/)).filter(Boolean).map((m, i) => ({ id: `CA-${i + 1}`, texto: m[1] }));
  return { criterios: lista, numerados: false };
}

export function armarIssueMd({ numero, titulo, estado, etiquetas, cuerpo, criterios }) {
  return [
    `# Issue #${numero}: ${titulo}`,
    "",
    `- Estado: ${estado}`,
    `- Etiquetas: ${etiquetas.join(", ")}`,
    "",
    String(cuerpo ?? "").trim(),
    "",
    "## Criterios numerados",
    "",
    ...(criterios.length ? criterios.map((c) => `- ${c.id}: ${c.texto}`) : ["- (pendiente: el agente deriva los CA-n del cuerpo)"]),
    "",
  ].join("\n");
}

const run = (raiz, cmd, ...args) => execFileSync(cmd, args, { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 });

// Desde dónde sale la rama de la historia: origin/<base> si existe; si no, la rama local <base> (una base que aún no se subió).
export const puntoDePartida = ({ remota, local, base }) => (remota ? `origin/${base}` : local ? base : undefined);

function existeRef(raiz, ref) {
  try { run(raiz, "git", "rev-parse", "--verify", "--quiet", ref); return true; } catch { return false; }
}

export function preparar({ n, base, raiz, trabajo }) {
  const issue = JSON.parse(run(raiz, "gh", "issue", "view", String(n), "--json", "number,title,body,labels,assignees,state"));
  if (issue.state === "CLOSED") return { resultado: "BLOQUEAR", motivo: "ya resuelto" };
  const prs = JSON.parse(run(raiz, "gh", "pr", "list", "--state", "open", "--search", `in:body "#${n}"`, "--json", "number,url"));
  if (prs.length) return { resultado: "BLOQUEAR", motivo: `ya resuelto en ${prs[0].url}` };
  if (!existsSync(join(raiz, "openspec", "config.yaml")) || !existsSync(join(raiz, ".claude", "skills", "openspec-propose", "SKILL.md"))) {
    return { resultado: "BLOQUEAR", motivo: "falta la línea base de OpenSpec" };
  }
  try { run(raiz, "git", "fetch", "origin"); } catch { /* sin red: se sigue con la base local */ }
  if (hayCambiosConSeguimiento(run(raiz, "git", "status", "--porcelain"))) {
    return { resultado: "BLOQUEAR", motivo: "el checkout principal tiene cambios sin commitear" };
  }
  const rama = `feature/issue-${n}-${slugDeTitulo(issue.title)}`;
  const existe = run(raiz, "git", "branch", "--list", rama).trim() !== "";
  let inicio;
  if (!existe) {
    inicio = puntoDePartida({ remota: existeRef(raiz, `refs/remotes/origin/${base}`), local: existeRef(raiz, `refs/heads/${base}`), base });
    if (!inicio) return { resultado: "BLOQUEAR", motivo: `la base ${base} no existe ni en origin ni en local` };
  }
  if (existe) run(raiz, "git", "switch", rama);
  else run(raiz, "git", "switch", "-c", rama, "--no-track", inicio);

  mkdirSync(trabajo, { recursive: true });
  const etiquetas = (issue.labels ?? []).map((l) => l.name);
  const { criterios, numerados } = extraerCriterios(issue.body);
  const archivos = [];
  const reutilizado = existsSync(join(trabajo, "issue.md"));
  if (!reutilizado) {
    writeFileSync(join(trabajo, "issue.md"), armarIssueMd({ numero: issue.number, titulo: issue.title, estado: issue.state === "OPEN" ? "abierto" : String(issue.state).toLowerCase(), etiquetas, cuerpo: issue.body, criterios }));
    archivos.push("issue.md");
  }
  for (const f of ["preguntas.md", "decisiones.md", "agentes-log.md"]) {
    if (!existsSync(join(trabajo, f))) { copyFileSync(join(DIR_PLANTILLAS, f), join(trabajo, f)); archivos.push(f); }
  }
  return {
    resultado: "OK",
    raiz,
    rama,
    ramaEstado: existe ? "reutilizada" : "creada",
    reutilizado,
    practica: etiquetas.includes("practica"),
    criterios,
    criteriosNumerados: numerados,
    seccionPreguntas: seccion(issue.body, /pregunta/i) ?? "",
    archivos,
  };
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [n, base] = o._;
  if (!n || !base) fallar("Uso: preparar.mjs <n> <base> [--trabajo <dir>] [--raiz <raiz>]", 2);
  const raiz = typeof o.raiz === "string" ? o.raiz : raizRepo();
  const trabajo = typeof o.trabajo === "string" ? o.trabajo : dirTrabajo(n, raiz);
  try {
    const r = preparar({ n, base, raiz, trabajo });
    console.log(JSON.stringify(r));
    process.exit(r.resultado === "OK" ? 0 : 3);
  } catch (e) {
    fallar(`preparar.mjs falló: ${String(e.stderr || e.message).trim()}`, 2);
  }
}
