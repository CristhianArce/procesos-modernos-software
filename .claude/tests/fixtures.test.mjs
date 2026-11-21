// CA-1: el formato de specs del proyecto, comprobado con OpenSpec sobre los changes de ejemplo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RAIZ } from "./util.mjs";

// Copia un change de fixture a un proyecto temporal con la config real y lo valida en modo estricto.
function validarFixture(nombre) {
  const dir = mkdtempSync(join(tmpdir(), "openspec-fixture-"));
  try {
    mkdirSync(join(dir, "openspec", "specs"), { recursive: true });
    mkdirSync(join(dir, "openspec", "changes"), { recursive: true });
    cpSync(join(RAIZ, "openspec", "config.yaml"), join(dir, "openspec", "config.yaml"));
    cpSync(join(RAIZ, ".claude", "fixtures", nombre), join(dir, "openspec", "changes", "acerca"), { recursive: true });
    const r = spawnSync("openspec", ["validate", "acerca", "--strict", "--type", "change", "--no-interactive"], {
      cwd: dir,
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    return { codigo: r.status, salida: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("CA-1: el change de ejemplo correcto pasa openspec validate --strict", () => {
  const { codigo, salida } = validarFixture("change-ok");
  assert.equal(codigo, 0, salida);
  assert.match(salida, /is valid/);
});

test("CA-1: el change con ### Requisito: falla openspec validate --strict", () => {
  const { codigo, salida } = validarFixture("change-espanol");
  assert.notEqual(codigo, 0, `debía fallar y pasó:\n${salida}`);
});
