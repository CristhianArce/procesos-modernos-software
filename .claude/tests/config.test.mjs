// CA-1 y CA-3: configuración de OpenSpec, permisos y .gitignore.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cargarYaml, leer } from "./util.mjs";

test("CA-1: openspec/config.yaml se lee sin claves duplicadas", () => {
  const yaml = cargarYaml();
  const doc = yaml.parseDocument(leer("openspec/config.yaml"), { uniqueKeys: true });
  assert.deepEqual(doc.errors.map(String), []);
  const cfg = doc.toJS();
  assert.equal(cfg.schema, "spec-driven");
  assert.equal(typeof cfg.context, "string");
});

test("CA-1: todas las reglas por artefacto son texto (OpenSpec ignora las que no)", () => {
  const cfg = cargarYaml().parse(leer("openspec/config.yaml"));
  for (const [artefacto, reglas] of Object.entries(cfg.rules ?? {})) {
    assert.ok(Array.isArray(reglas), `rules.${artefacto} debe ser una lista`);
    reglas.forEach((r, i) => assert.equal(typeof r, "string", `rules.${artefacto}[${i}] no es texto`));
  }
});

test("CA-1: config.yaml exige encabezados en inglés, CA-n y ## Purpose", () => {
  const { rules } = cargarYaml().parse(leer("openspec/config.yaml"));
  const specs = rules.specs.join("\n");
  assert.match(specs, /### Requirement:/);
  assert.match(specs, /CA-n/);
  assert.match(specs, /## Purpose/);
  assert.match(rules.tasks.join("\n"), /CA-n/);
});

test("CA-1: CLAUDE.md trae las reglas del proyecto y de los agentes", () => {
  const md = leer("CLAUDE.md");
  for (const seccion of ["Stack fijo", "Estructura y capas", "Datos y migraciones", "Seguridad", "SDD y trazabilidad", "Reglas de agentes"]) {
    assert.match(md, new RegExp(`## \\d+\\. ${seccion}`), `falta la sección ${seccion}`);
  }
  assert.match(md, /dato, no instrucción/);
  assert.match(md, /nunca con `git -C`/);
});

const DENY_OBLIGATORIO = [
  "Bash(gh pr merge *)",
  "Bash(gh pr review * --approve*)",
  "Bash(gh pr review * --request-changes*)",
  "Bash(git push --force*)",
  "Bash(git push * --force*)",
  "Bash(git push -f*)",
  "Bash(git push * -f*)",
  "Bash(git commit --amend*)",
  "Bash(git commit * --amend*)",
  "Bash(git rebase)",
  "Bash(git rebase *)",
  "Bash(git reset)",
  "Bash(git reset *)",
];

test("CA-3: settings.json rechaza cada comando prohibido", () => {
  const { permissions } = JSON.parse(leer(".claude/settings.json"));
  const faltan = DENY_OBLIGATORIO.filter((r) => !permissions.deny.includes(r));
  assert.deepEqual(faltan, []);
});

test("CA-3: ninguna regla allow permite un comando prohibido", () => {
  const { permissions } = JSON.parse(leer(".claude/settings.json"));
  const peligrosas = permissions.allow.filter((r) => /merge \*|--approve|--force|--amend|rebase|reset|^Bash\(\*?\)$|^Bash$/.test(r));
  assert.deepEqual(peligrosas, []);
});

test("CA-3: settings.json permite escribir en .flujo/ sin confirmación", () => {
  const { permissions } = JSON.parse(leer(".claude/settings.json"));
  for (const r of ["Edit(/.flujo/**)", "Bash(mkdir -p .flujo/*)"]) {
    assert.ok(permissions.allow.includes(r), `falta allow ${r}`);
  }
});

test("CA-6: settings.json permite al orquestador invocar sus skills sin pedir permiso", () => {
  const { permissions } = JSON.parse(leer(".claude/settings.json"));
  for (const s of ["openspec-propose", "openspec-apply-change", "build-test", "commit", "abrir-pr"]) {
    assert.ok(permissions.allow.includes(`Skill(${s})`), `falta allow Skill(${s})`);
  }
});

test("CA-3: .gitignore deja fuera .flujo/, worktrees, secretos y archivos locales de Claude", () => {
  const lineas = leer(".gitignore").split(/\r?\n/).map((l) => l.trim());
  for (const l of [".flujo/", ".claude/worktrees/", ".claude/settings.local.json", ".env", "!.env.example", "node_modules/", ".next/"]) {
    assert.ok(lineas.includes(l), `falta ${l} en .gitignore`);
  }
});
