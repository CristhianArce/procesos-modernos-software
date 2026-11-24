// CA-6: lo que contexto.mjs deja en contexto.md para que la sesión y los agentes lean menos código.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  ampliarContexto,
  convenciones,
  entorno,
  entradasDe,
  firmasCompartidas,
  firmasPublicas,
  fusionar,
  historiasConstruidas,
  moduloDeReferencia,
  partesDelContexto,
  plataformaConfigurada,
  productoYBacklog,
  reglasDeNegocio,
  requisitosDeSpec,
} from "../skills/actualizar-contexto/scripts/contexto.mjs";

const temporal = () => mkdtempSync(join(tmpdir(), "ctx-"));
const leerRepo = (ruta) => readFileSync(join(import.meta.dirname, "..", "..", ruta), "utf8");

test("CA-6: el orquestador solo lee context/ y los agentes lo usan antes de abrir código", () => {
  const skill = leerRepo(".claude/skills/orquestador/SKILL.md");
  assert.match(skill, /Contexto por partes[\s\S]*fuera del flujo[\s\S]*no lo genera ni lo escribe, solo lo lee/);
  assert.match(skill, /no esté ya decidido[\s\S]*MODIFIED Requirements[\s\S]*No explores el repo/);
  assert.match(skill, /`context\/contexto\.md` debe existir[\s\S]*bloqueado: falta context\//);
  assert.doesNotMatch(skill, /contexto\.mjs/, "el flujo no corre el script del contexto");
  assert.match(leerRepo(".claude/agents/revisor-salida.md"), /Negocio: el change no contradice una regla de `context\/negocio\/<capacidad>\.md`/);
  assert.match(leerRepo(".claude/agents/escritor-pruebas.md"), /context\/codigo\.md[\s\S]*context\/convenciones\.md/);
  assert.match(leerRepo("openspec/config.yaml"), /design\.md cita nombres reales de context\//);
});

test("CA-6: actualizar-contexto es un skill de la persona, fuera del flujo y sin commit", () => {
  const texto = leerRepo(".claude/skills/actualizar-contexto/SKILL.md");
  const cabecera = texto.split("---")[1];
  assert.match(cabecera, /name: actualizar-contexto/);
  assert.match(cabecera, /disable-model-invocation: true/, "solo lo invoca la persona");
  assert.match(cabecera, /allowed-tools: Read Bash\(node \.claude\/skills\/actualizar-contexto\/scripts\/\*\)/);
  assert.doesNotMatch(cabecera, /git (add|commit|push)/);
  assert.match(texto, /\*\*No forma parte del flujo del orquestador\*\*/);
  assert.match(texto, /\*\*Nunca borra\.\*\*/);
  for (const [, ruta] of texto.matchAll(/`node (\.claude\/skills\/[\w./-]+\.mjs)/g)) {
    assert.ok(existsSync(join(import.meta.dirname, "..", "..", ruta)), `el skill nombra un script que no existe: ${ruta}`);
  }
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
  escribir(
    "docs/propuesta.md",
    [
      "# Propuesta",
      "",
      "## 1. Resumen",
      "",
      "Construiremos algo.",
      "",
      "La aplicación permite administrar nodos y simular lecturas.",
      "",
      "## 5. Backlog de historias de usuario",
      "",
      "| # | Historia | Fase | Depende de | Entrega |",
      "| --- | --- | --- | --- | --- |",
      "| 3 | Login con roles (admin y técnico) | Línea base | 2 | `auth` |",
      "| 8 | **Afectados por un nodo.** Texto largo que no entra | Clase | Línea base e historia 3 | Tabla propia `nodo_usuarios` |",
      "",
      "## 6. Otra",
      "",
      "| 9 | no entra | x | y | z |",
    ].join("\n"),
  );
  escribir("evidencias/issue-5/issue.md", "# Issue #5: HU 3: Login\n\n## Historia\n\nComo persona quiero entrar.\n\n## Reglas de negocio\n\n- **RN-1:** Dos roles.\n- **RN-2:** Sesión de 8 horas.\n\n## Fuera de alcance\n\n- Recuperar contraseña.\n\n## Otra\n\n- no entra\n");
  escribir(
    "evidencias/issue-5/decisiones.md",
    "| # | Fecha | Fase | Decisión | Decidió | Votos | Evidencia | Alternativas descartadas | Revisar |\n|---|---|---|---|---|---|---|---|---|\n| 1 | 2026-11-22 | Propuesta | La sesión dura 8 horas | Persona | — | preguntas.md #1 | 1 hora | no |\n| 2 | 2026-11-22 | Propuesta | Un detalle técnico | Orquestador | — | x | y | sí |\n",
  );
  escribir("evidencias/issue-6/issue.md", "## Historia\n\nComo equipo quiero un proyecto base.\n\n## Reglas de negocio\n\n- **RN-1:** Stack fijo.\n");
  escribir("evidencias/issue-7/issue.md", "# Issue #7: sin reglas\n\n## Historia\n\nComo x quiero y.\n");
  escribir(
    "openspec/specs/inicio/spec.md",
    "# Spec\n\n## Purpose\n\nPermite entrar al tablero.\n\n## Requirements\n\n### Requirement: Inicio de sesión\nLa API SHALL iniciar sesión\ncon usuario y contraseña (CA-1).\n\nOtro párrafo que no entra.\n\n#### Scenario: Credenciales correctas (CA-1)\n- **WHEN** x\n- **THEN** y\n\n#### Scenario: Contraseña incorrecta (CA-2)\n- **WHEN** x\n- **THEN** y\n\n### Requirement: Cierre de sesión\nLa API SHALL cerrar la sesión.\n",
  );
  escribir("openspec/specs/ci/spec.md", "# Spec\n\n## Purpose\n\nCorre el CI.\n\n### Requirement: Validación de cada PR\nEl CI SHALL correr.\n");
  escribir(
    "openspec/changes/aislar/specs/aislamiento/spec.md",
    "# Spec Delta\n\n## Purpose\n\nAísla un nodo.\n\n## ADDED Requirements\n\n### Requirement: Aislar un nodo\nLa API SHALL cambiar el estado.\n\n#### Scenario: Aislar (CA-1)\n- **WHEN** x\n- **THEN** y\n",
  );
  escribir("openspec/changes/archive/viejo/specs/viejo/spec.md", "## Purpose\n\nNo entra.\n\n### Requirement: Viejo\nNo entra.\n");
  escribir(".claude/orquestador.json", JSON.stringify({ base: "main", plataforma: ["ci"] }));
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

const parteDe = (partes, ruta) => partes.find((p) => p.ruta === ruta);
const textoDe = (partes, ruta) => parteDe(partes, ruta)?.entradas.map((e) => e.texto).join("\n") ?? "";

test(
  "CA-6: el código y las convenciones van en sus partes, sin repetir las reglas de CLAUDE.md",
  conRepo((raiz) => {
    const partes = partesDelContexto(raiz);
    const codigo = textoDe(partes, "codigo.md");
    assert.ok(codigo.includes("Módulo de referencia: `a`"));
    assert.ok(codigo.includes("`a/service.ts`") && codigo.includes("export async function buscar"));
    assert.ok(codigo.includes("Compartido `src/lib/errores.ts`"));
    const convenciones = textoDe(partes, "convenciones.md");
    assert.ok(convenciones.includes("Flyway: `flyway/flyway:11`"));
    assert.ok(convenciones.includes("Última migración: `V202611220002__b.sql`"));
    assert.ok(!partes.some((p) => p.entradas.some((e) => e.texto.includes("Reglas del proyecto"))), "las reglas ya están cargadas en cada agente");
  }),
);

test(
  "CA-6: el producto trae el resumen y el backlog con sus dependencias, solo de la sección 5",
  conRepo((raiz) => {
    const p = productoYBacklog(join(raiz, "docs", "propuesta.md"));
    assert.equal(p.resumen, "La aplicación permite administrar nodos y simular lecturas.");
    assert.deepEqual(p.historias.map((h) => h.n), ["3", "8"], "la tabla de otra sección no entra");
    assert.equal(p.historias[1].historia, "Afectados por un nodo", "se queda con la primera frase, sin negritas");
    assert.equal(p.historias[1].dependeDe, "Línea base e historia 3");
    assert.deepEqual(productoYBacklog(join(raiz, "no-existe.md")), { resumen: null, historias: [] });
  }),
);

test(
  "CA-6: las historias construidas traen sus RN, lo fuera de alcance y solo las decisiones de la persona",
  conRepo((raiz) => {
    const h = historiasConstruidas(join(raiz, "evidencias"));
    assert.deepEqual(h.map((x) => x.issue), [5, 6], "issue-7 no tiene reglas y se omite");
    assert.equal(h[0].titulo, "HU 3: Login");
    assert.deepEqual(h[0].reglas, ["- **RN-1:** Dos roles.", "- **RN-2:** Sesión de 8 horas."]);
    assert.deepEqual(h[0].fueraDeAlcance, ["- Recuperar contraseña."]);
    assert.deepEqual(h[0].decisiones, [{ numero: "1", texto: "La sesión dura 8 horas" }], "la decisión del orquestador no entra");
    assert.equal(h[1].titulo, "Como equipo quiero un proyecto base.", "sin título usa la frase de la historia");
  }),
);

test(
  "CA-6: cada requisito trae su texto completo y los nombres de sus escenarios",
  conRepo((raiz) => {
    const inicio = reglasDeNegocio(raiz, ["ci"]).find((c) => c.capacidad === "inicio");
    assert.equal(inicio.origen, "vigente");
    assert.equal(inicio.proposito, "Permite entrar al tablero.");
    assert.deepEqual(inicio.requisitos[0], {
      nombre: "Inicio de sesión",
      texto: "La API SHALL iniciar sesión con usuario y contraseña (CA-1).",
      escenarios: ["Credenciales correctas (CA-1)", "Contraseña incorrecta (CA-2)"],
    });
    assert.equal(inicio.requisitos[1].texto, "La API SHALL cerrar la sesión.");
    assert.deepEqual(requisitosDeSpec("sin requisitos"), []);
  }),
);

test(
  "CA-6: las reglas incluyen los changes en curso, dejan fuera los archivados y marcan la plataforma",
  conRepo((raiz) => {
    const reglas = reglasDeNegocio(raiz, plataformaConfigurada(raiz));
    assert.deepEqual(reglas.map((c) => c.capacidad), ["ci", "inicio", "aislamiento"], "el archivo viejo no entra");
    assert.equal(reglas.find((c) => c.capacidad === "aislamiento").origen, "en curso (aislar)");
    assert.deepEqual(reglas.filter((c) => c.plataforma).map((c) => c.capacidad), ["ci"]);
    assert.deepEqual(plataformaConfigurada(temporal()), [], "sin configuración no hay plataforma");
  }),
);

test("CA-6: fusionar agrega lo nuevo, reemplaza lo que cambió y conserva lo demás", () => {
  const parte = { titulo: "# T", intro: "intro", entradas: [{ id: "a", texto: "uno" }, { id: "b", texto: "dos" }] };
  const primera = fusionar("", parte);
  assert.deepEqual([primera.agregadas, primera.reemplazadas, primera.cambiado], [2, 0, true]);
  assert.deepEqual(entradasDe(primera.texto), [{ id: "a", texto: "uno" }, { id: "b", texto: "dos" }]);
  const igual = fusionar(primera.texto, parte);
  assert.deepEqual([igual.agregadas, igual.reemplazadas, igual.cambiado], [0, 0, false], "repetir no cambia nada");
  const cambio = fusionar(primera.texto, { ...parte, entradas: [{ id: "b", texto: "dos cambiado" }, { id: "c", texto: "tres" }] });
  assert.deepEqual(
    entradasDe(cambio.texto),
    [{ id: "a", texto: "uno" }, { id: "b", texto: "dos cambiado" }, { id: "c", texto: "tres" }],
    "a se conserva aunque ya no venga, b se reemplaza en su lugar y c se agrega al final",
  );
  assert.deepEqual([cambio.agregadas, cambio.reemplazadas], [1, 1]);
  assert.equal(fusionar(primera.texto.replace(/\n/g, "\r\n"), parte).cambiado, false, "un CRLF no cuenta como cambio");
  assert.equal(fusionar("", { ...parte, entradas: [{ id: "x", texto: "con cr\r" }] }).texto.includes("\r"), false, "se quita el \\r suelto de las fuentes CRLF");
});

test(
  "CA-6: ampliar el contexto la primera vez crea las partes y repetirlo no escribe nada",
  conRepo((raiz) => {
    const destino = join(raiz, "context");
    const primera = ampliarContexto(raiz, destino);
    assert.ok(primera.agregadas > 0 && primera.reemplazadas === 0);
    for (const f of ["contexto.md", "producto.md", "historias.md", "inventario.md", "codigo.md", "convenciones.md", "negocio/inicio.md", "negocio/aislamiento.md"]) {
      assert.ok(existsSync(join(destino, f)), `falta ${f}`);
    }
    assert.ok(!existsSync(join(destino, "negocio", "ci.md")), "la plataforma no tiene parte propia");
    const segunda = ampliarContexto(raiz, destino);
    assert.deepEqual({ agregadas: segunda.agregadas, reemplazadas: segunda.reemplazadas, escritos: segunda.escritos }, { agregadas: 0, reemplazadas: 0, escritos: [] });
  }),
);

test(
  "CA-6: ampliar agrega lo nuevo y reemplaza solo lo que cambió, sin borrar lo que ya no está en las fuentes",
  conRepo((raiz) => {
    const destino = join(raiz, "context");
    ampliarContexto(raiz, destino);
    mkdirSync(join(raiz, "evidencias", "issue-9"), { recursive: true });
    writeFileSync(join(raiz, "evidencias", "issue-9", "issue.md"), "# Issue #9: HU 9: Histórico\n\n## Reglas de negocio\n\n- **RN-1:** Solo lee lecturas.\n");
    const spec = join(raiz, "openspec", "specs", "inicio", "spec.md");
    writeFileSync(spec, readFileSync(spec, "utf8").replace("La API SHALL cerrar la sesión.", "La API SHALL cerrar la sesión y limpiar la cookie."));
    rmSync(join(raiz, "openspec", "changes", "aislar"), { recursive: true, force: true });

    const r = ampliarContexto(raiz, destino);
    assert.equal(r.agregadas, 1, "la historia 9");
    assert.equal(r.reemplazadas, 1, "el requisito de cierre de sesión");
    const historias = readFileSync(join(destino, "historias.md"), "utf8");
    assert.ok(historias.includes("## #9 HU 9: Histórico") && historias.includes("## #5 HU 3: Login"), "se agrega sin quitar la anterior");
    const inicio = readFileSync(join(destino, "negocio", "inicio.md"), "utf8");
    assert.ok(inicio.includes("La API SHALL cerrar la sesión y limpiar la cookie."));
    assert.ok(!inicio.includes("(vigente): La API SHALL cerrar la sesión."), "la versión anterior se reemplazó");
    assert.ok(existsSync(join(destino, "negocio", "aislamiento.md")), "lo que desaparece de las fuentes se conserva");
    assert.ok(readFileSync(join(destino, "contexto.md"), "utf8").includes("| aislamiento |"), "el índice incluye lo acumulado");
  }),
);

test(
  "CA-6: una capacidad vigente que un change en curso modifica queda en una sola parte con la versión más reciente",
  conRepo((raiz) => {
    const destino = join(raiz, "context");
    ampliarContexto(raiz, destino);
    mkdirSync(join(raiz, "openspec", "changes", "mod", "specs", "inicio"), { recursive: true });
    writeFileSync(
      join(raiz, "openspec", "changes", "mod", "specs", "inicio", "spec.md"),
      "## Purpose\n\nCambia el inicio.\n\n## MODIFIED Requirements\n\n### Requirement: Cierre de sesión\nLa API SHALL cerrar y avisar.\n",
    );
    ampliarContexto(raiz, destino);
    const entradas = entradasDe(readFileSync(join(destino, "negocio", "inicio.md"), "utf8"));
    assert.equal(entradas.filter((e) => e.id === "requisito: Cierre de sesión").length, 1);
    assert.ok(entradas.find((e) => e.id === "requisito: Cierre de sesión").texto.includes("(en curso (mod)): La API SHALL cerrar y avisar."));
    assert.ok(entradas.some((e) => e.id === "requisito: Inicio de sesión"), "los requisitos que no cambian siguen");
  }),
);

test(
  "CA-6: el índice dice qué lee cada paso y lista las capacidades acumuladas, con la plataforma solo por nombre",
  conRepo((raiz) => {
    const destino = join(raiz, "context");
    ampliarContexto(raiz, destino);
    const indice = readFileSync(join(destino, "contexto.md"), "utf8");
    assert.ok(indice.includes("## Qué leer en cada paso"));
    assert.ok(indice.includes("| 3 Propuesta (la sesión) |") && indice.includes("| 5 Escribir pruebas (`escritor-pruebas`) |"));
    assert.ok(indice.includes("| inicio | Permite entrar al tablero. | `context/negocio/inicio.md` |"), "una línea por capacidad con su propósito");
    assert.ok(indice.includes("`ci`"), "la plataforma va por nombre");
    assert.ok(!indice.includes("El CI SHALL correr."), "sin el texto de sus requisitos");
    assert.ok(!existsSync(join(raiz, "context", "reglas.md")), "las reglas de CLAUDE.md no se copian");
  }),
);

test(
  "CA-6: contexto.mjs amplía context/ sin pedir un issue, y repetirlo dice que está al día",
  conRepo((raiz) => {
    const correr = () =>
      spawnSync(process.execPath, [join(import.meta.dirname, "..", "skills", "actualizar-contexto", "scripts", "contexto.mjs"), "--raiz", raiz], { encoding: "utf8" });
    const primera = correr();
    assert.equal(primera.status, 0);
    assert.match(primera.stdout, /Contexto ampliado en context\/: \d+ entradas nuevas, 0 reemplazadas/);
    assert.ok(existsSync(join(raiz, "context", "contexto.md")));
    const segunda = correr();
    assert.equal(segunda.status, 0);
    assert.match(segunda.stdout, /Contexto al día: sin novedades/);
  }),
);
