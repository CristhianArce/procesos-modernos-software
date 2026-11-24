// CA-6: lo que contexto.mjs deja en contexto.md para que la sesión y los agentes lean menos código.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  convenciones,
  entorno,
  firmasCompartidas,
  firmasPublicas,
  generarContexto,
  moduloDeReferencia,
  reglasDelProyecto,
} from "../skills/orquestador/scripts/contexto.mjs";

const temporal = () => mkdtempSync(join(tmpdir(), "ctx-"));
const leerRepo = (ruta) => readFileSync(join(import.meta.dirname, "..", "..", ruta), "utf8");

test("CA-6: el orquestador, escritor-pruebas y las reglas de design mandan usar contexto.md antes de abrir código", () => {
  assert.match(leerRepo(".claude/skills/orquestador/SKILL.md"), /Contexto antes que código[\s\S]*no explores el repo/);
  assert.match(leerRepo(".claude/agents/escritor-pruebas.md"), /Módulo de referencia[\s\S]*Herramientas y modismos/);
  assert.match(leerRepo("openspec/config.yaml"), /design\.md cita nombres reales de \.flujo\/issue-<n>\/contexto\.md/);
});

// Repo mínimo con dos módulos completos (a, el más grande), uno incompleto (c) y las configuraciones que lee contexto.mjs.
function repoDePrueba() {
  const raiz = temporal();
  const escribir = (ruta, texto = "") => {
    mkdirSync(dirname(join(raiz, ruta)), { recursive: true });
    writeFileSync(join(raiz, ruta), texto);
  };
  for (const f of ["repo", "schema"]) escribir(`src/modulos/a/${f}.ts`);
  escribir(
    "src/modulos/a/service.ts",
    [
      "export async function buscar(id: string): Promise<Nodo | null> {",
      "}",
      "export const esquema = z.object({ id: z.string() });",
      "export const listar = (n: number): string[] => repo.todos(n);",
      "export async function larga(",
      "  a: string,",
      ") {}",
      "export type Tipo = string;",
      "",
    ].join("\n"),
  );
  escribir("src/modulos/a/__tests__/formulario-a.test.ts");
  escribir("src/modulos/a/__tests__/repo.int.test.ts");
  escribir("src/modulos/a/__tests__/service.test.ts");
  escribir("src/modulos/a/ui/FormularioA.tsx", '<p data-testid="total-a">1</p>');
  escribir("src/modulos/a/ui/malNombre.tsx");
  for (const f of ["repo", "service", "schema"]) escribir(`src/modulos/b/${f}.ts`);
  escribir("src/modulos/c/service.ts", "export function solo() {}\n");
  escribir("src/app/api/a/route.ts");
  escribir("src/app/api/__tests__/a.int.test.ts");
  escribir("src/test/api.ts", "export async function peticion(): Promise<Request> {\n}\n");
  escribir("src/lib/errores.ts", 'export class ErrorHttp extends Error {}\nthrow new ErrorHttp(404, "Nodo no encontrado");\n');
  escribir("src/app/globals.css", ":root { --sc-fondo: #000; }\n@layer components {\n  .boton-primario {\n    color: red;\n  }\n}\n");
  escribir(
    "db/migration/V202611210001__a.sql",
    "CREATE TABLE a (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), creado timestamptz NOT NULL DEFAULT now(), n text CHECK (n <> ''));",
  );
  escribir(
    "db/migration/V202611220002__b.sql",
    "CREATE TABLE b (id uuid PRIMARY KEY, a_id uuid REFERENCES a (id) ON DELETE CASCADE);\nCREATE INDEX b_a_idx ON b (a_id);",
  );
  escribir(
    "package.json",
    JSON.stringify({ scripts: { "test:unit": "vitest run --project unit" }, dependencies: { zod: "4.6.7" }, devDependencies: { vitest: "5.1.1" } }),
  );
  escribir("vitest.config.mts", 'projects: [{ extends: true, test: { name: "unit", include: ["src/**/__tests__/**/*.test.ts"] } }]');
  escribir("playwright.config.ts", 'export default { testDir: "e2e", use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000" } };');
  escribir(
    "docker-compose.yml",
    "services:\n  db:\n    image: postgres:17-alpine\n  flyway:\n    image: flyway/flyway:11\n    volumes:\n      - ./db/migration:/flyway/sql:ro\n",
  );
  escribir(
    "CLAUDE.md",
    `# CLAUDE.md\n\n## 2. Comandos\n\n- no entra\n\n## 3. Stack fijo\n\nTypeScript y Next.\n\n## 4. Capas\n\n- Capa uno.\n  - detalle largo ${"x".repeat(300)}\n\n## 8. Agentes\n\n- no entra\n`,
  );
  return raiz;
}

const conRepo = (comprobar) => () => {
  const raiz = repoDePrueba();
  try {
    comprobar(raiz);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
};

test(
  "CA-6: el módulo de referencia es el completo con más archivos y solo trae rutas que existen",
  conRepo((raiz) => {
    const ref = moduloDeReferencia(raiz);
    assert.equal(ref.modulo, "a", "b tiene menos archivos y c no es completo");
    const rutas = Object.fromEntries(ref.archivos);
    assert.equal(rutas.Repo, "src/modulos/a/repo.ts");
    assert.equal(rutas.Handler, "src/app/api/a/route.ts");
    assert.equal(rutas["Prueba de integración del handler"], "src/app/api/__tests__/a.int.test.ts");
    assert.equal(rutas["Prueba de integración del repo"], "src/modulos/a/__tests__/repo.int.test.ts");
    assert.equal(rutas["Prueba de componente"], "src/modulos/a/__tests__/formulario-a.test.ts", "service.test.ts y las .int quedan fuera");
    assert.equal(rutas["Componente de ui"], "src/modulos/a/ui/FormularioA.tsx");
    assert.equal(rutas["Helpers de prueba"], "src/test/api.ts");
    assert.equal(moduloDeReferencia(temporal()), null, "sin módulos completos no hay referencia");
  }),
);

test(
  "CA-6: las firmas públicas conservan la firma de las funciones y reducen las constantes a su nombre",
  conRepo((raiz) => {
    const todas = firmasPublicas(join(raiz, "src", "modulos"));
    const service = todas.find((f) => f.modulo === "a" && f.archivo === "service.ts");
    assert.deepEqual(service.firmas, [
      "export async function buscar(id: string): Promise<Nodo | null>",
      "export const esquema",
      "export const listar = (n: number): string[] => repo.todos(n);",
      "export async function larga(…)",
    ]);
    assert.equal(todas.some((f) => f.modulo === "b"), false, "un archivo sin exportaciones no aparece");
    assert.deepEqual(firmasCompartidas(raiz).map((f) => f.ruta), ["src/lib/errores.ts", "src/test/api.ts"]);
  }),
);

test(
  "CA-6: las convenciones salen del código: migración, errores, data-testid, clases y nombres",
  conRepo((raiz) => {
    const c = convenciones(raiz);
    assert.equal(c.ultimaMigracion, "V202611220002__b.sql");
    assert.deepEqual(c.mensajesDeError, ["404 Nodo no encontrado"]);
    assert.deepEqual(c.testIds, ["total-a"]);
    assert.deepEqual(c.clases, ["boton-primario"]);
    assert.deepEqual(c.modulos, ["a", "b", "c"]);
    assert.deepEqual(c.componentes, { siguen: 1, total: 2 }, "malNombre.tsx no es PascalCase");
    assert.deepEqual(c.pruebasKebab, { siguen: 3, total: 3 });
  }),
);

test(
  "CA-6: el entorno lee librerías, Vitest, Playwright, Postgres, Flyway y los modismos de las migraciones",
  conRepo((raiz) => {
    const e = entorno(raiz);
    assert.deepEqual(e.dependencias, ["zod@4.6.7"]);
    assert.deepEqual(e.dependenciasDev, ["vitest@5.1.1"]);
    assert.deepEqual(e.scripts, ["npm run test:unit → vitest run --project unit"]);
    assert.deepEqual(e.proyectosVitest, ['unit: "src/**/__tests__/**/*.test.ts"']);
    assert.deepEqual(e.e2e, { directorio: "e2e", baseUrl: "http://localhost:3000" });
    assert.equal(e.postgres, "postgres:17-alpine");
    assert.deepEqual(e.flyway, { imagen: "flyway/flyway:11", carpeta: "db/migration" });
    assert.deepEqual(e.tiposSql, ["text", "timestamptz", "uuid"]);
    assert.equal(e.modismosSql.length, 5, "uuid con gen_random_uuid, timestamptz con now, CASCADE, CHECK e índice _idx");
    assert.deepEqual(e.tokens, ["--sc-fondo"]);
    assert.equal(entorno(temporal()).postgres, null, "sin configuración no inventa nada");
  }),
);

test(
  "CA-6: las reglas se copian completas de CLAUDE.md §3 a §7 y dejan fuera el resto",
  conRepo((raiz) => {
    const reglas = reglasDelProyecto(join(raiz, "CLAUDE.md"));
    assert.deepEqual(reglas.map((s) => s.titulo), ["3. Stack fijo", "4. Capas"]);
    assert.deepEqual(reglas[0].lineas, ["TypeScript y Next."], "una sección sin viñetas aporta su párrafo");
    assert.equal(reglas[1].lineas[0], "- Capa uno.");
    assert.ok(reglas[1].lineas[1].length > 300, "sin recortar");
    assert.deepEqual(reglasDelProyecto(join(raiz, "no-existe.md")), []);
  }),
);

test(
  "CA-6: contexto.md trae módulo de referencia, firmas, convenciones, herramientas y reglas",
  conRepo((raiz) => {
    const texto = generarContexto(raiz);
    for (const titulo of [
      "## Módulo de referencia",
      "## Firmas públicas",
      "## Compartido: núcleo y componentes",
      "## Convenciones del repo",
      "## Herramientas y modismos",
      "## Reglas del proyecto",
    ]) {
      assert.ok(texto.includes(titulo), `falta ${titulo}`);
    }
    assert.ok(texto.includes("Módulo: `a`"));
    assert.ok(texto.includes("Flyway: `flyway/flyway:11`"));
  }),
);
