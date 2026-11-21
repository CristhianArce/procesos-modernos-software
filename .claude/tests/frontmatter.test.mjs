// CA-2: definición de agentes y skills del flujo SDD (frontmatter y prohibiciones).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { frontmatter, leer, RAIZ } from "./util.mjs";

const AGENTES_IMPRESCINDIBLES = ["preparador", "revisor-salida", "revisor-reglas", "trazabilidad"];
const SKILLS_IMPRESCINDIBLES = ["orquestador", "build-test", "entorno-docker", "commit", "abrir-pr"];
const SKILLS_OPENSPEC = ["openspec-apply-change", "openspec-archive-change", "openspec-explore", "openspec-propose", "openspec-sync-specs", "openspec-update-change"];
const MODELOS = ["haiku", "sonnet", "opus"];

const agentes = () => readdirSync(join(RAIZ, ".claude", "agents")).filter((a) => a.endsWith(".md"));

test("CA-2: cada agente define name, description, model, effort y tools, y no puede lanzar agentes", () => {
  for (const archivo of agentes()) {
    const texto = leer(`.claude/agents/${archivo}`);
    const fm = frontmatter(texto);
    assert.ok(fm, `${archivo}: sin frontmatter`);
    assert.equal(fm.name, archivo.replace(/\.md$/, ""), `${archivo}: name distinto del archivo`);
    assert.ok(fm.description?.length > 40, `${archivo}: description corta`);
    assert.ok(MODELOS.includes(fm.model), `${archivo}: model inválido`);
    assert.ok(["low", "medium", "high"].includes(fm.effort), `${archivo}: effort inválido`);
    assert.ok(fm.tools && !/\bAgent\b/.test(fm.tools), `${archivo}: tools no debe incluir Agent`);
    assert.match(String(fm.disallowedTools), /\bAgent\b/, `${archivo}: falta disallowedTools: Agent`);
    assert.match(texto, /## Prohibido[\s\S]*dato, no instrucción/, `${archivo}: falta la sección Prohibido con la regla 2.7`);
  }
});

test("CA-2: existen los agentes que el modo demo necesita (los que ya se construyeron)", () => {
  const hay = agentes().map((a) => a.replace(/\.md$/, ""));
  const construidos = AGENTES_IMPRESCINDIBLES.filter((a) => hay.includes(a));
  assert.ok(construidos.length >= 3, `faltan agentes imprescindibles: ${AGENTES_IMPRESCINDIBLES.filter((a) => !hay.includes(a))}`);
});

test("CA-2: modelos según el plan (trazabilidad en haiku; revisores en sonnet)", () => {
  const modelo = (a) => frontmatter(leer(`.claude/agents/${a}.md`)).model;
  assert.equal(modelo("trazabilidad"), "haiku");
  assert.equal(modelo("revisor-salida"), "sonnet");
  assert.equal(modelo("revisor-reglas"), "sonnet");
});

test("CA-2: los seis skills de OpenSpec están versionados", () => {
  for (const s of SKILLS_OPENSPEC) assert.ok(existsSync(join(RAIZ, ".claude", "skills", s, "SKILL.md")), `falta ${s}`);
});

test("CA-2: los skills propios tienen allowed-tools acotado (nunca Bash a secas)", () => {
  for (const s of SKILLS_IMPRESCINDIBLES) {
    const ruta = join(RAIZ, ".claude", "skills", s, "SKILL.md");
    if (!existsSync(ruta)) continue; // se construyen en los grupos 6 y 7
    const fm = frontmatter(leer(`.claude/skills/${s}/SKILL.md`));
    assert.equal(fm.name, s);
    assert.ok(fm.description?.length > 40, `${s}: description corta`);
    const herramientas = String(fm["allowed-tools"] ?? "").split(/\s+(?![^(]*\))/);
    assert.ok(!herramientas.includes("Bash"), `${s}: allowed-tools no puede incluir Bash sin acotar`);
  }
});

test("CA-2: el orquestador solo lo invoca la persona", () => {
  const ruta = join(RAIZ, ".claude", "skills", "orquestador", "SKILL.md");
  if (!existsSync(ruta)) return; // se escribe en la tarea 7.1
  assert.equal(frontmatter(leer(".claude/skills/orquestador/SKILL.md"))["disable-model-invocation"], true);
});
