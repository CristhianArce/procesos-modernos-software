// Abre el PR en borrador de la historia en una sola llamada y lo deja ABIERTO: crea el borrador (con la etiqueta
// `migracion` si el diff trae migraciones), devuelve el existente si ya hay uno, y registra PR y estado en estado.md.
// Nunca cierra, fusiona ni marca el PR como listo. Falla si, al terminar, el PR no está en estado OPEN.
// Uso: node .claude/skills/orquestador/scripts/abrir-pr.mjs <n> --rama <rama> --base <base> --titulo "<título sin (#n)>" [--trabajo <dir>]
// Usa `<trabajo>/pr-body.md` como cuerpo. Salida: "CREADO <url>" o "YA EXISTÍA <url>".
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones } from "./comun.mjs";
import { escribirCampo, rutaEstado } from "./estado.mjs";

export const hayMigraciones = (archivos) => archivos.some((a) => a.replace(/\\/g, "/").startsWith("db/migration/"));

export const urlDeSalida = (texto) => texto.match(/https:\/\/github\.com\/\S+\/pull\/\d+/)?.[0];

export const yaExiste = (texto) => /already exists/i.test(texto);

export const etiquetaInexistente = (texto) => /label/i.test(texto) && /(not found|could not add|does not exist)/i.test(texto);

/** Argumentos de `gh pr create` (siempre en borrador). */
export function argumentosCrear({ n, rama, base, titulo, cuerpo, conEtiqueta }) {
  return [
    "pr", "create", "--draft", "--base", base, "--head", rama,
    "--title", `${titulo} (#${n})`, "--body-file", cuerpo,
    ...(conEtiqueta ? ["--label", "migracion"] : []),
  ];
}

const correr = (cmd, args) => {
  try {
    return { ok: true, salida: execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { ok: false, salida: `${e.stdout ?? ""}${e.stderr ?? ""}${e.message ?? ""}` };
  }
};

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const [n] = o._;
  if (!n || typeof o.rama !== "string" || typeof o.base !== "string" || typeof o.titulo !== "string") {
    fallar('Uso: abrir-pr.mjs <n> --rama <rama> --base <base> --titulo "<título sin (#n)>" [--trabajo <dir>]', 2);
  }
  const trabajo = o.trabajo ?? dirTrabajo(n);
  const cuerpo = join(trabajo, "pr-body.md");
  if (!existsSync(cuerpo)) fallar(`Falta el cuerpo del PR: ${cuerpo}`, 2);

  const diff = correr("git", ["diff", "--name-only", `origin/${o.base}...HEAD`]);
  const conEtiqueta = diff.ok && hayMigraciones(diff.salida.split(/\r?\n/));
  let r = correr("gh", argumentosCrear({ n, rama: o.rama, base: o.base, titulo: o.titulo, cuerpo, conEtiqueta }));
  if (!r.ok && conEtiqueta && etiquetaInexistente(r.salida)) {
    console.error("La etiqueta `migracion` no existe: se abre el PR sin ella.");
    r = correr("gh", argumentosCrear({ n, rama: o.rama, base: o.base, titulo: o.titulo, cuerpo, conEtiqueta: false }));
  }
  let creado = r.ok;
  let url = urlDeSalida(r.salida);
  if (!r.ok) {
    if (!yaExiste(r.salida)) fallar(`No se pudo abrir el PR: ${r.salida.trim()}`, 1);
    creado = false; // idempotente: se devuelve el PR que ya existe y no se crea otro
  }
  const v = correr("gh", ["pr", "view", o.rama, "--json", "number,url,state", "--jq", '.state + " " + .url']);
  if (!v.ok) fallar(`No se pudo leer el PR de ${o.rama}: ${v.salida.trim()}`, 1);
  const [estadoPr, urlPr] = v.salida.trim().split(" ");
  url = urlPr ?? url;
  if (estadoPr !== "OPEN") fallar(`El PR ${url} no está abierto (estado ${estadoPr}): el flujo debe dejarlo abierto. No se reabre solo; avisa a la persona.`, 1);

  const ruta = rutaEstado(n, trabajo);
  let estado = readFileSync(ruta, "utf8");
  estado = escribirCampo(estado, "PR", url);
  estado = escribirCampo(estado, "Estado del item", "PR abierto");
  writeFileSync(ruta, estado);
  console.log(`${creado ? "CREADO" : "YA EXISTÍA"} ${url}`);
}
