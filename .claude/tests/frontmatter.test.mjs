// CA-2: definición de agentes y skills del flujo SDD (frontmatter y prohibiciones).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cargarYaml, frontmatter, leer, RAIZ } from "./util.mjs";

const AGENTES_IMPRESCINDIBLES = ["preparador", "revisor-salida", "revisor-reglas"];
const SKILLS_IMPRESCINDIBLES = ["orquestador", "build-test", "commit", "abrir-pr"];
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

test("CA-2: existen los tres agentes que usa el flujo", () => {
  const hay = agentes().map((a) => a.replace(/\.md$/, ""));
  assert.deepEqual(AGENTES_IMPRESCINDIBLES.filter((a) => !hay.includes(a)), []);
});

test("CA-2: modelos (opus genera, sonnet revisa)", () => {
  const agente = (a) => frontmatter(leer(`.claude/agents/${a}.md`));
  assert.equal(agente("preparador").model, "sonnet");
  assert.equal(agente("preparador").effort, "medium");
  assert.equal(agente("revisor-salida").model, "sonnet");
  assert.equal(agente("revisor-reglas").model, "sonnet");
  assert.equal(agente("revisor-reglas").effort, "medium");
});

test("CA-2: la sesión del orquestador (propuesta, implementación y corrección) corre con opus", () => {
  const texto = leer(".claude/skills/orquestador/SKILL.md");
  assert.equal(frontmatter(texto).model, "opus");
  assert.doesNotMatch(texto, /Todo con sonnet/);
  // El effort que se pasa al lanzar un agente tiene prioridad sobre su frontmatter: deben coincidir.
  assert.match(texto, /`preparador` \(`subagent_type: preparador`, `model: sonnet`, `effort: medium`\)/);
  assert.match(texto, /agente `revisor-reglas` \(`model: sonnet`, `effort: medium`\)/);
});

test("CA-2: la revisión de la propuesta recibe preguntas.md y preguntas.md llega a las evidencias", () => {
  // Si el orquestador no le pasa la ruta, el criterio 3c de revisor-salida no puede revisarse.
  assert.match(leer(".claude/skills/orquestador/SKILL.md"), /Preguntas: \.flujo\/issue-<n>\/preguntas\.md\./);
  assert.match(leer(".claude/skills/orquestador/scripts/copiar-evidencias.mjs"), /"preguntas\.md"/);
  // El estado `diferida` es la salida para lo que la persona no puede responder: los tres lo conocen.
  for (const ruta of [".claude/agents/preparador.md", ".claude/agents/revisor-salida.md", ".claude/skills/orquestador/SKILL.md"]) {
    assert.match(leer(ruta), /`diferida`/, `${ruta}: falta el estado diferida`);
  }
});

test("CA-6: el orquestador registra con un script, no pega CLAUDE.md, prepara la revisión de la propuesta y deja lint y build al CI (decisión 29)", () => {
  const texto = leer(".claude/skills/orquestador/SKILL.md");
  // Cada script que nombra el skill existe: una ruta rota detendría la corrida.
  for (const [, ruta] of texto.matchAll(/`node (\.claude\/skills\/[\w./-]+\.mjs)/g)) {
    assert.ok(existsSync(join(RAIZ, ruta)), `SKILL.md nombra un script que no existe: ${ruta}`);
  }
  assert.match(texto, /scripts\/registrar-agente\.mjs <n> "<paso>"/);
  assert.doesNotMatch(texto, /estado\.mjs escribir <n> "Última fase cerrada"/, "las marcas las deja registrar-agente.mjs");
  assert.doesNotMatch(texto, /Reglas del proyecto: <secciones 3 a 8/, "CLAUDE.md ya está en el contexto de los agentes");
  assert.match(texto, /\*\*no se las pegues\*\*/);
  assert.match(texto, /--decisiones \.flujo\/issue-<n>\/decisiones\.md/);
  assert.match(texto, /\*\*corrige solo los hallazgos\*\*/);
  assert.match(texto, /no corras `npm run lint`, `npm run build`, `test:integration`, `e2e` ni `openspec validate --all`/);
  // Los revisores encuentran las reglas sin que se las pasen.
  for (const a of ["revisor-salida", "revisor-reglas"]) {
    assert.match(leer(`.claude/agents/${a}.md`), /si no las ves, léelas de `<raiz>\/CLAUDE\.md`/, `${a}: falta el respaldo de CLAUDE.md`);
  }
  assert.match(leer(".claude/agents/revisor-salida.md"), /`decisionesSinFila`/);
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

test("CA-6: pasos 1 y 2 juntos, con la parte mecánica del paso 1 en preparar.mjs", () => {
  const texto = leer(".claude/skills/orquestador/SKILL.md");
  assert.match(texto, /Los pasos 1 y 2 van en un mismo mensaje/);
  assert.match(texto, /El agente corre `preparar\.mjs`/);
  assert.match(leer(".claude/agents/preparador.md"), /scripts\/preparar\.mjs <n> <base>/);
});

test("CA-6: la revisión de la propuesta corre en segundo plano durante la implementación y se recoge antes de verificar", () => {
  const texto = leer(".claude/skills/orquestador/SKILL.md");
  assert.match(texto, /`revisor-salida` \(`model: sonnet`, `effort: medium`, `run_in_background: true`/);
  assert.match(texto, /recógelo antes de lanzar el paso 6/);
  assert.match(texto, /Antes de lanzar el paso 6, confirma que la revisión del paso 4 terminó/);
  assert.match(texto, /`--paralelo` como \*\*último\*\* argumento/);
});

test("CA-6: escritor-pruebas solo crea pruebas, sin Bash ni lanzar agentes, y el orquestador lo lanza en segundo plano", () => {
  const agente = frontmatter(leer(".claude/agents/escritor-pruebas.md"));
  assert.equal(agente.model, "sonnet");
  assert.equal(agente.effort, "medium");
  assert.doesNotMatch(agente.tools, /Bash|Edit/, "escribe archivos nuevos y no ejecuta comandos");
  assert.match(agente.disallowedTools, /Agent/);
  const texto = leer(".claude/skills/orquestador/SKILL.md");
  assert.match(texto, /lanza \*\*tres veces\*\* el agente `escritor-pruebas`, una por tipo y las tres en paralelo \(cada una con `subagent_type: escritor-pruebas`, `model: sonnet`, `effort: medium`, `run_in_background: true`\)/);
  assert.match(texto, /<tipo>: unitarias, integracion o e2e/);
  assert.match(texto, /recoge a los tres agentes `escritor-pruebas`/);
  assert.match(texto, /"5 Escribir pruebas \(<tipo>\)" escritor-pruebas "sonnet \/ medium" <id> <OK o PARCIAL> "" --paralelo/);
});

test("CA-6: design.md fija las firmas públicas para que las pruebas se escriban en paralelo con el código", () => {
  const { rules } = cargarYaml().parse(leer("openspec/config.yaml"));
  assert.match(rules.design.join("\n"), /## Interfaces/);
  assert.match(leer(".claude/agents/escritor-pruebas.md"), /`## Interfaces` de `design\.md`/);
});

test("CA-6: escritor-pruebas reparte el trabajo por tipo, un archivo de supuestos por tipo y e2e sin totales de la semilla", () => {
  const texto = leer(".claude/agents/escritor-pruebas.md");
  for (const tipo of ["unitarias", "integracion", "e2e"]) assert.match(texto, new RegExp(`\| \`${tipo}\` \|`));
  assert.match(texto, /pruebas-supuestos-<tipo>\.md/);
  assert.match(texto, /ni siquiera sobre la semilla/);
});

test("CA-6: el paso 6 prepara el paquete del diff y revisor-reglas lo lee de una vez", () => {
  const texto = leer(".claude/skills/orquestador/SKILL.md");
  assert.match(texto, /scripts\/paquete-diff\.mjs <n> <base>/);
  assert.match(texto, /<trabajo>: \.flujo\/issue-<n>\/\.` \(en modo práctica/);
  assert.match(leer(".claude/agents/revisor-reglas.md"), /revision-diff\.md/);
});

test("CA-6: el paso 5 deja hitos de tiempo y escritor-pruebas trae su lista de errores frecuentes", () => {
  const texto = leer(".claude/skills/orquestador/SKILL.md");
  assert.match(texto, /tiempos\.mjs hito <n> "5 código listo"/);
  assert.match(texto, /tiempos\.mjs hito <n> "5 pruebas reconciliadas"/);
  const agente = leer(".claude/agents/escritor-pruebas.md");
  assert.match(agente, /## Errores frecuentes/);
  assert.match(agente, /no reconoce tildes ni la ñ/);
  assert.match(agente, /Texto decorado/);
  assert.match(agente, /Ausencias que pasan por una razón equivocada/);
});
