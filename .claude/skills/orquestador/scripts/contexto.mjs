// Escribe <trabajo>/contexto.md con lo que ya existe en el repo, para que la propuesta no suponga tablas ni módulos.
// Uso: node .claude/skills/orquestador/scripts/contexto.mjs <n> [--raiz <raiz>] [--trabajo <dir>]
// Sin agentes ni BD: lee openspec/specs/, openspec/changes/, db/migration/, src/modulos/, db/seed/ y contracts/openapi.yaml,
// y deja el módulo de referencia (las rutas del módulo completo más grande) como patrón de código y de pruebas.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dirTrabajo, esPrincipal, fallar, opciones, raizRepo } from "./comun.mjs";
import { registrarCierre } from "./tiempos.mjs";

export const PUNTOS_EXTENSION = ["menu.ts", "paneles.ts", "on-alerta.ts", "metrics.ts"];
const listar = (d) => (existsSync(d) ? readdirSync(d).sort() : []);

// Tablas y columnas desde CREATE TABLE y ALTER TABLE … ADD COLUMN, en orden de versión.
export function tablasDeMigraciones(dirMigraciones) {
  const tablas = new Map();
  const tabla = (nombre) => {
    if (!tablas.has(nombre)) tablas.set(nombre, { columnas: [], migraciones: [] });
    return tablas.get(nombre);
  };
  const nombreLimpio = (s) => s.replace(/"/g, "").replace(/^public\./, "");
  for (const archivo of listar(dirMigraciones).filter((a) => a.endsWith(".sql"))) {
    const sql = readFileSync(join(dirMigraciones, archivo), "utf8").replace(/--.*$/gm, "");
    for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(([\s\S]*?)\);/gi)) {
      const t = tabla(nombreLimpio(m[1]));
      t.migraciones.push(archivo);
      for (const parte of m[2].split(/,(?![^(]*\))/)) {
        const col = parte.trim().match(/^"?(\w+)"?\s+\w/);
        if (col && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)$/i.test(col[1])) t.columnas.push(col[1]);
      }
    }
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?([\w."]+)\s+([\s\S]*?);/gi)) {
      const t = tabla(nombreLimpio(m[1]));
      for (const c of m[2].matchAll(/ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi)) {
        if (!/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK)$/i.test(c[1])) t.columnas.push(c[1]);
      }
      if (!t.migraciones.includes(archivo)) t.migraciones.push(archivo);
    }
  }
  return tablas;
}

export function modulosConExtension(dirModulos) {
  return listar(dirModulos)
    .filter((m) => statSync(join(dirModulos, m)).isDirectory())
    .map((m) => ({ modulo: m, puntos: PUNTOS_EXTENSION.filter((p) => existsSync(join(dirModulos, m, p))) }));
}

// Rutas y métodos de contracts/openapi.yaml, leyendo la indentación (sin dependencias).
export function rutasDelContrato(rutaContrato) {
  if (!existsSync(rutaContrato)) return [];
  const rutas = [];
  let enPaths = false;
  let actual = null;
  for (const linea of readFileSync(rutaContrato, "utf8").split(/\r?\n/)) {
    if (/^paths:\s*$/.test(linea)) { enPaths = true; continue; }
    if (enPaths && /^\S/.test(linea)) enPaths = false;
    if (!enPaths) continue;
    const ruta = linea.match(/^ {2}(['"]?)(\/[^'":]*)\1:\s*$/);
    if (ruta) { actual = { ruta: ruta[2], metodos: [] }; rutas.push(actual); continue; }
    const metodo = linea.match(/^ {4}(get|post|put|patch|delete|head|options):/i);
    if (metodo && actual) actual.metodos.push(metodo[1].toUpperCase());
  }
  return rutas;
}

// Capacidades ya especificadas en openspec/specs/<cap>/spec.md: su Purpose y sus requisitos (fuente de verdad del comportamiento).
export function capacidadesEspecificadas(dirSpecs) {
  return listar(dirSpecs)
    .filter((c) => existsSync(join(dirSpecs, c, "spec.md")))
    .map((c) => {
      const texto = readFileSync(join(dirSpecs, c, "spec.md"), "utf8");
      const proposito = (texto.split(/^## Purpose\s*$/m)[1] ?? "").split(/^##\s/m)[0].trim().split(/\r?\n\r?\n/)[0].replace(/\s+/g, " ");
      const requisitos = [...texto.matchAll(/^### Requirement:\s*(.+)$/gm)].map((m) => m[1].trim());
      return { capacidad: c, proposito, requisitos };
    });
}

// Changes de OpenSpec en curso (sin archivar): otra historia puede estar tocando lo mismo.
export const changesActivos = (dirChanges) =>
  listar(dirChanges).filter((c) => c !== "archive" && statSync(join(dirChanges, c)).isDirectory());

const contarArchivos = (dir) =>
  listar(dir).reduce((n, e) => n + (statSync(join(dir, e)).isDirectory() ? contarArchivos(join(dir, e)) : 1), 0);

// Módulo de referencia: el módulo completo (repo, service y schema) con más archivos; a igualdad, el primero por nombre.
// Solo rutas, nunca contenido: las lee la sesión en lugar de explorar el repo antes de escribir (pasos 3 y 5).
export function moduloDeReferencia(raiz) {
  const dirModulos = join(raiz, "src", "modulos");
  const completos = listar(dirModulos).filter((m) => ["repo.ts", "service.ts", "schema.ts"].every((f) => existsSync(join(dirModulos, m, f))));
  if (!completos.length) return null;
  const modulo = completos
    .map((m) => ({ m, n: contarArchivos(join(dirModulos, m)) }))
    .sort((a, b) => b.n - a.n || a.m.localeCompare(b.m))[0].m;
  const base = `src/modulos/${modulo}`;
  const existe = (ruta) => existsSync(join(raiz, ...ruta.split("/")));
  const primero = (dir, filtro) => {
    const f = listar(join(raiz, ...dir.split("/"))).find(filtro);
    return f ? `${dir}/${f}` : null;
  };
  const archivos = [
    ["Repo", `${base}/repo.ts`],
    ["Service", `${base}/service.ts`],
    ["Schema", `${base}/schema.ts`],
    ["Handler", `src/app/api/${modulo}/route.ts`],
    ["Prueba de integración del handler", `src/app/api/__tests__/${modulo}.int.test.ts`],
    ["Prueba de integración del repo", primero(`${base}/__tests__`, (f) => f.endsWith(".int.test.ts"))],
    ["Prueba de componente", primero(`${base}/__tests__`, (f) => f.endsWith(".test.ts") && !/\.int\.|^(service|schema|extensiones)\./.test(f))],
    ["Componente de ui", primero(`${base}/ui`, (f) => f.endsWith(".tsx"))],
    ["Helpers de prueba", "src/test/api.ts"],
  ].filter(([, ruta]) => ruta && existe(ruta));
  return { modulo, archivos };
}

const ARCHIVOS_CON_FIRMAS = ["schema.ts", "repo.ts", "service.ts"];

// Firmas públicas (la primera línea de cada `export`) de schema, repo y service de cada módulo: con ellas la propuesta, el diseño
// y las pruebas citan nombres reales sin abrir el código. Las exportaciones `export type` y `export {` quedan fuera.
// Una función o clase conserva su firma; una constante que no es función (un esquema Zod, una lista) queda solo con su nombre.
const firmaDe = (linea) => {
  const l = linea.trim();
  const constante = l.match(/^export\s+const\s+(\w+)/);
  if (constante && !/=\s*(async\s*)?(\([^)]*\)|\w+)\s*(:[^=]+)?=>/.test(l) && !/=\s*(async\s+)?function/.test(l)) return `export const ${constante[1]}`;
  const firma = l.replace(/\s*\{\s*$/, "").replace(/\s*=>\s*\{?\s*$/, " =>").slice(0, 140);
  return firma.endsWith("(") ? `${firma}…)` : firma; // parámetros en varias líneas: se abren en el archivo
};

const firmasDeArchivo = (ruta) =>
  readFileSync(ruta, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^export\s+(async\s+)?(function|const|class)\s/.test(l))
    .map(firmaDe);

export function firmasPublicas(dirModulos) {
  const filas = [];
  for (const modulo of listar(dirModulos).filter((m) => statSync(join(dirModulos, m)).isDirectory())) {
    for (const archivo of ARCHIVOS_CON_FIRMAS.filter((a) => existsSync(join(dirModulos, modulo, a)))) {
      const firmas = firmasDeArchivo(join(dirModulos, modulo, archivo));
      if (firmas.length) filas.push({ modulo, archivo, firmas });
    }
  }
  return filas;
}

// Lo compartido que toda historia debe reutilizar en lugar de reescribir: el núcleo (`src/lib/`) y los componentes de `src/modulos/ui/`.
export function firmasCompartidas(raiz) {
  const carpetas = ["src/lib", "src/modulos/ui", "src/test"];
  return carpetas.flatMap((dir) =>
    listar(join(raiz, ...dir.split("/")))
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => ({ ruta: `${dir}/${f}`, firmas: firmasDeArchivo(join(raiz, ...dir.split("/"), f)) }))
      .filter((x) => x.firmas.length),
  );
}

// Archivos de código (sin pruebas) bajo `dir`, recursivo y en orden.
const archivosDeCodigo = (dir) =>
  listar(dir).flatMap((e) => {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) return e === "__tests__" || e === "node_modules" ? [] : archivosDeCodigo(p);
    return /\.tsx?$/.test(e) ? [p] : [];
  });

const unicos = (xs) => [...new Set(xs)].sort();

// Convenciones que ya usa el repo y que una historia nueva debe repetir para no inventar otras: nombres de migración, mensajes de error,
// `data-testid` y clases del sistema de diseño.
export function convenciones(raiz) {
  const codigo = archivosDeCodigo(join(raiz, "src")).map((p) => readFileSync(p, "utf8"));
  const migraciones = listar(join(raiz, "db", "migration")).filter((a) => a.endsWith(".sql"));
  const css = existsSync(join(raiz, "src", "app", "globals.css")) ? readFileSync(join(raiz, "src", "app", "globals.css"), "utf8") : "";
  // Nombres: cuántos archivos siguen cada forma (componentes en PascalCase, pruebas en kebab-case) sobre el total que hay.
  const nombres = (dirs, patron) => {
    const todos = dirs.flatMap((d) => archivosDeCodigo(d).map((p) => p.split(/[\\/]/).pop())).filter((n) => n.endsWith(".tsx"));
    return { siguen: todos.filter((n) => patron.test(n)).length, total: todos.length };
  };
  const modulos = join(raiz, "src", "modulos");
  const dirsUi = listar(modulos).map((m) => join(modulos, m, "ui"));
  const pruebas = (dir) => listar(dir).filter((f) => /\.test\.ts$/.test(f));
  const nombresPruebas = listar(modulos).flatMap((m) => pruebas(join(modulos, m, "__tests__")));
  return {
    modulos: listar(modulos).filter((m) => statSync(join(modulos, m)).isDirectory()),
    componentes: nombres(dirsUi, /^[A-Z][A-Za-z0-9]*\.tsx$/),
    pruebasKebab: { siguen: nombresPruebas.filter((n) => /^[a-z0-9]+(-[a-z0-9]+)*(\.int)?\.test\.ts$/.test(n)).length, total: nombresPruebas.length },
    ultimaMigracion: migraciones.at(-1) ?? null,
    mensajesDeError: unicos(codigo.flatMap((t) => [...t.matchAll(/new ErrorHttp\(\s*(\d{3}),\s*"([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`))),
    testIds: unicos(codigo.flatMap((t) => [...t.matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1]))),
    clases: unicos([...css.matchAll(/^ {2}\.([a-z][\w-]*)\s*\{/gm)].map((m) => m[1])),
  };
}

const leerSi = (ruta) => (existsSync(ruta) ? readFileSync(ruta, "utf8") : "");

// Herramientas y modismos del proyecto, leídos de sus archivos de configuración: librerías (fijas), scripts de npm, proyectos de Vitest,
// e2e con Playwright, Postgres y Flyway (imagen, carpeta y modismos de las migraciones) y tokens de diseño.
export function entorno(raiz) {
  let paquete = {};
  try {
    paquete = JSON.parse(leerSi(join(raiz, "package.json")) || "{}");
  } catch {
    paquete = {};
  }
  const versiones = (o = {}) => Object.entries(o).map(([n, v]) => `${n}@${v}`);
  const vitest = leerSi(join(raiz, "vitest.config.mts")) || leerSi(join(raiz, "vitest.config.ts"));
  const proyectos = [...vitest.matchAll(/name:\s*"(\w+)",\s*include:\s*\[([^\]]*)\]/g)].map((m) => `${m[1]}: ${m[2].replace(/\s+/g, " ").trim()}`);
  const playwright = leerSi(join(raiz, "playwright.config.ts"));
  const compose = leerSi(join(raiz, "docker-compose.yml"));
  const sql = listar(join(raiz, "db", "migration"))
    .filter((a) => a.endsWith(".sql"))
    .map((a) => readFileSync(join(raiz, "db", "migration", a), "utf8").replace(/--.*$/gm, ""))
    .join("\n");
  const modismos = [
    ["`uuid PRIMARY KEY DEFAULT gen_random_uuid()` como clave", /uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/i],
    ["`timestamptz NOT NULL DEFAULT now()` para fechas", /timestamptz\s+NOT NULL\s+DEFAULT\s+now\(\)/i],
    ["`REFERENCES … ON DELETE CASCADE` en claves foráneas", /ON DELETE CASCADE/i],
    ["`CHECK (…)` para dominios y rangos", /CHECK\s*\(/i],
    ["índices con nombre `<tabla>_<columna>_idx`", /CREATE\s+(UNIQUE\s+)?INDEX\s+\w+_idx\b/i],
  ].filter(([, re]) => re.test(sql)).map(([t]) => t);
  return {
    dependencias: versiones(paquete.dependencies),
    dependenciasDev: versiones(paquete.devDependencies),
    scripts: Object.entries(paquete.scripts ?? {}).map(([n, c]) => `npm run ${n} → ${c}`),
    proyectosVitest: proyectos,
    e2e: { directorio: playwright.match(/testDir:\s*"([^"]+)"/)?.[1] ?? null, baseUrl: playwright.match(/BASE_URL\s*\?\?\s*"([^"]+)"/)?.[1] ?? null },
    postgres: compose.match(/image:\s*(postgres:[\w.-]+)/)?.[1] ?? null,
    flyway: { imagen: compose.match(/image:\s*(flyway\/flyway:[\w.-]+)/)?.[1] ?? null, carpeta: compose.match(/-\s*\.\/(db\/migration):/)?.[1] ?? null },
    tiposSql: unicos([...sql.matchAll(/\b(uuid|text|integer|bigint|numeric|double precision|timestamptz|boolean|jsonb)\b/gi)].map((m) => m[1].toLowerCase())),
    modismosSql: modismos,
    tokens: unicos([...leerSi(join(raiz, "src", "app", "globals.css")).matchAll(/(--sc-[\w-]+)\s*:/g)].map((m) => m[1])),
  };
}

// Reglas de CLAUDE.md §3 a §7 (stack, estructura y capas, datos, seguridad, SDD), copiadas tal cual del propio archivo para que el
// contexto no se desfase de las reglas.
export function reglasDelProyecto(rutaClaude) {
  if (!existsSync(rutaClaude)) return [];
  const secciones = [];
  let actual = null;
  for (const linea of readFileSync(rutaClaude, "utf8").split(/\r?\n/)) {
    const h = linea.match(/^## (\d+)\.\s*(.+)$/);
    if (h) {
      actual = Number(h[1]) >= 3 && Number(h[1]) <= 7 ? { titulo: `${h[1]}. ${h[2]}`, lineas: [], texto: null } : null;
      if (actual) secciones.push(actual);
      continue;
    }
    if (!actual) continue;
    if (/^\s*- /.test(linea)) actual.lineas.push(linea.replace(/\s+$/, ""));
    else if (!actual.texto && linea.trim() && !/^\s/.test(linea)) actual.texto = linea.trim();
  }
  return secciones.map((s) => ({ titulo: s.titulo, lineas: s.lineas.length ? s.lineas : s.texto ? [s.texto] : [] }));
}

export function generarContexto(raiz) {
  const referencia = moduloDeReferencia(raiz);
  const firmas = firmasPublicas(join(raiz, "src", "modulos"));
  const compartido = firmasCompartidas(raiz);
  const conv = convenciones(raiz);
  const reglas = reglasDelProyecto(join(raiz, "CLAUDE.md"));
  const env = entorno(raiz);
  const lista = (xs, vacio = "(ninguno)") => (xs.length ? xs.map((x) => `\`${x}\``).join(", ") : vacio);
  const tablas = tablasDeMigraciones(join(raiz, "db", "migration"));
  const modulos = modulosConExtension(join(raiz, "src", "modulos"));
  const semillas = listar(join(raiz, "db", "seed")).filter((a) => a.endsWith(".sql"));
  const rutas = rutasDelContrato(join(raiz, "contracts", "openapi.yaml"));
  const capacidades = capacidadesEspecificadas(join(raiz, "openspec", "specs"));
  const changes = changesActivos(join(raiz, "openspec", "changes"));
  const l = [
    "# Contexto del repositorio",
    "",
    "Generado por `contexto.mjs`. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.",
    "",
    "## Capacidades especificadas",
    "",
    "Comportamiento ya especificado en `openspec/specs/`. Si la historia cambia una de estas capacidades, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito; no se crea otra capacidad para lo mismo.",
    "",
    "| Capacidad | Propósito | Requisitos |",
    "|---|---|---|",
    ...capacidades.map((c) => `| ${c.capacidad} | ${c.proposito || "(sin Purpose)"} | ${c.requisitos.join("; ") || "(ninguno)"} |`),
    ...(capacidades.length ? [] : ["| (ninguna) | | |"]),
    "",
    "## Changes activos",
    "",
    ...(changes.length ? changes.map((c) => `- openspec/changes/${c}/`) : ["- (ninguno)"]),
    "",
    "## Tablas y columnas",
    "",
    "| Tabla | Columnas | Migraciones |",
    "|---|---|---|",
    ...[...tablas].map(([t, v]) => `| ${t} | ${[...new Set(v.columnas)].join(", ")} | ${v.migraciones.join(", ")} |`),
    ...(tablas.size ? [] : ["| (ninguna) | | |"]),
    "",
    "## Módulos y puntos de extensión",
    "",
    "| Módulo | Puntos de extensión |",
    "|---|---|",
    ...modulos.map((m) => `| ${m.modulo} | ${m.puntos.join(", ") || "(ninguno)"} |`),
    ...(modulos.length ? [] : ["| (ninguno) | |"]),
    "",
    "## Semillas",
    "",
    ...(semillas.length ? semillas.map((s) => `- db/seed/${s}`) : ["- (ninguna)"]),
    "",
    "## Rutas del contrato",
    "",
    "| Ruta | Métodos |",
    "|---|---|",
    ...rutas.map((r) => `| ${r.ruta} | ${r.metodos.join(", ")} |`),
    ...(rutas.length ? [] : ["| (ninguna) | |"]),
    "",
    "## Módulo de referencia",
    "",
    "Patrón a seguir (nombres, capas y forma de las pruebas) en lugar de explorar el repo. Son rutas, no contenido: léelas antes de escribir y no copies lo que no aplique a la historia.",
    "",
    ...(referencia ? [`Módulo: \`${referencia.modulo}\``, "", ...referencia.archivos.map(([rol, ruta]) => `- ${rol}: \`${ruta}\``)] : ["- (ninguno)"]),
    "",
    "## Firmas públicas",
    "",
    "Lo que exporta cada módulo (`schema.ts`, `repo.ts`, `service.ts`). Úsalo para citar nombres reales y para escribir `## Interfaces` sin abrir el código; abre un archivo solo si la firma no alcanza.",
    "",
    ...(firmas.length ? firmas.flatMap((f) => [`### ${f.modulo}/${f.archivo}`, "", ...f.firmas.map((s) => `- \`${s}\``), ""]) : ["- (ninguna)", ""]),
    "## Compartido: núcleo y componentes",
    "",
    "Se reutiliza, no se reescribe ni se edita (el núcleo es intocable; un componente reutilizable nuevo va en `src/modulos/ui/`).",
    "",
    ...(compartido.length ? compartido.flatMap((f) => [`### ${f.ruta}`, "", ...f.firmas.map((s) => `- \`${s}\``), ""]) : ["- (ninguno)", ""]),
    "## Convenciones del repo",
    "",
    "Lo que el código ya hace: repítelo con los mismos nombres. Los nombres de archivos, componentes y pruebas siguen los del módulo de referencia.",
    "",
    `- Nombres en español, sin tildes en archivos y carpetas. Módulos existentes: ${lista(conv.modulos)}. Componentes de \`ui/\` en PascalCase (${conv.componentes.siguen} de ${conv.componentes.total}); pruebas en kebab-case (${conv.pruebasKebab.siguen} de ${conv.pruebasKebab.total}); migraciones \`V<AAAAMMDDHHmm>__descripcion.sql\`.`,
    `- Última migración:${conv.ultimaMigracion ? `\`${conv.ultimaMigracion}\` (la nueva usa una versión \`V<AAAAMMDDHHmm>\` posterior)` : "(ninguna)"}`,
    `- Mensajes de error de servicio (estado y texto): ${conv.mensajesDeError.length ? conv.mensajesDeError.map((m) => `\`${m}\``).join("; ") : "(ninguno)"}`,
    `- \`data-testid\` en uso: ${conv.testIds.length ? conv.testIds.map((t) => `\`${t}\``).join(", ") : "(ninguno)"}`,
    `- Clases del sistema de diseño (\`globals.css\`): ${conv.clases.length ? conv.clases.map((c) => `\`.${c}\``).join(", ") : "(ninguna)"}`,
    "",
    "## Herramientas y modismos",
    "",
    "Leído de `package.json`, `vitest.config.mts`, `playwright.config.ts`, `docker-compose.yml`, `db/migration/` y `globals.css`. Las librerías son las fijas del proyecto: no se agrega ninguna sin aprobación.",
    "",
    `- Librerías: ${lista(env.dependencias)}`,
    `- Desarrollo: ${lista(env.dependenciasDev)}`,
    `- Scripts: ${lista(env.scripts)}`,
    `- Pruebas unitarias e integración (Vitest, proyectos): ${lista(env.proyectosVitest)}. Una prueba de integración va en \`*.int.test.ts\`; \`server-only\` se simula con \`src/test/vacio.ts\`.`,
    `- Pruebas e2e (Playwright): carpeta \`${env.e2e.directorio ?? "(ninguna)"}\`, contra una app ya levantada en \`BASE_URL\` (por defecto \`${env.e2e.baseUrl ?? "(ninguna)"}\`).`,
    `- Postgres: \`${env.postgres ?? "(ninguno)"}\`, acceso con \`pg\` y SQL a mano solo en \`repo.ts\`. Tipos usados en las migraciones: ${lista(env.tiposSql)}.`,
    `- Flyway: \`${env.flyway.imagen ?? "(ninguno)"}\`, lee \`${env.flyway.carpeta ?? "(ninguna)"}\` (\`docker compose run --rm flyway migrate info\`). Modismos de las migraciones: ${env.modismosSql.length ? env.modismosSql.join("; ") : "(ninguno)"}.`,
    `- Tokens de diseño (\`globals.css\`): ${lista(env.tokens)}`,
    "",
    "## Reglas del proyecto (resumen de CLAUDE.md §3 a §7)",
    "",
    "Copiadas de `CLAUDE.md`, que es la fuente: ante una duda, manda `CLAUDE.md`.",
    "",
    ...(reglas.length ? reglas.flatMap((s) => [`### ${s.titulo}`, "", ...s.lineas, ""]) : ["- (CLAUDE.md no encontrado)", ""]),
  ];
  return l.join("\n");
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const n = o._[0];
  if (!n) fallar("Uso: contexto.mjs <n> [--raiz <raiz>] [--trabajo <dir>]", 2);
  const raiz = o.raiz ?? raizRepo();
  const trabajo = o.trabajo ?? dirTrabajo(n);
  mkdirSync(trabajo, { recursive: true });
  writeFileSync(join(trabajo, "contexto.md"), generarContexto(raiz));
  // Cierra el paso 2 en tiempos.md (si la corrida se está midiendo): el orquestador no necesita otra llamada.
  registrarCierre(join(trabajo, "tiempos.md"), 2);
  console.log(join(trabajo, "contexto.md"));
}
