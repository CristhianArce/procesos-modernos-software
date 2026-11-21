import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Cada Route Handler de src/app/api aparece en contracts/openapi.yaml (CA-2, CA-3).
function rutasApi(dir = "src/app/api"): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : rutasApi(ruta);
    return e.name === "route.ts" ? ["/" + relative("src/app", dir).split(sep).join("/").replace(/\[([^\]]+)\]/g, "{$1}")] : [];
  });
}

describe("contrato OpenAPI", () => {
  const contrato = readFileSync("contracts/openapi.yaml", "utf8");

  it("#2 CA-2, CA-3: declara OpenAPI 3.1", () => {
    expect(contrato).toMatch(/^openapi: 3\.1\.\d+$/m);
  });

  it.each(rutasApi())("#2 CA-2, CA-3: el contrato incluye %s", (ruta) => {
    expect(contrato).toMatch(new RegExp(`^  ${ruta.replace(/[{}]/g, "\\$&")}:$`, "m"));
  });
});
