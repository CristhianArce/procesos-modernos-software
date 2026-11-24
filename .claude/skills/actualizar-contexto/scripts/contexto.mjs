// Amplía `context/` (el contexto acumulado del producto, versionado) con lo nuevo que tienen las fuentes. Solo agrega y reemplaza la
// entrada que cambió: nunca borra ni regenera todo, y no escribe si no hay novedades. Lo corre el skill `actualizar-contexto`, fuera del
// flujo del orquestador, que solo lo lee. Negocio (producto, historias, reglas por capacidad) y técnica (inventario, código,
// convenciones) van en partes, para que cada paso lea solo lo que necesita.
// Uso: node .claude/skills/actualizar-contexto/scripts/contexto.mjs [--raiz <raiz>] [--destino <dir>]
// Sin agentes ni BD: lee docs/propuesta.md, evidencias/, openspec/specs/, openspec/changes/, db/migration/, src/ y contracts/openapi.yaml,
// y deja el módulo de referencia (las rutas del módulo completo más grande) como patrón de código y de pruebas.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { esPrincipal, opciones, raizRepo } from "../../orquestador/scripts/comun.mjs";

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

const propositoDe = (texto) => (texto.split(/^## Purpose\s*$/m)[1] ?? "").split(/^##\s/m)[0].trim().split(/\r?\n\r?\n/)[0].replace(/\s+/g, " ");

// Capacidades ya especificadas en openspec/specs/<cap>/spec.md: su Purpose y sus requisitos (fuente de verdad del comportamiento).
export function capacidadesEspecificadas(dirSpecs) {
  return listar(dirSpecs)
    .filter((c) => existsSync(join(dirSpecs, c, "spec.md")))
    .map((c) => {
      const texto = readFileSync(join(dirSpecs, c, "spec.md"), "utf8");
      const requisitos = [...texto.matchAll(/^### Requirement:\s*(.+)$/gm)].map((m) => m[1].trim());
      return { capacidad: c, proposito: propositoDe(texto), requisitos };
    });
}

// ── Contexto de negocio ────────────────────────────────────────────────────────────────────────────────────────────────────────
// Lo que el producto ya promete, leído de sus fuentes (propuesta, issues archivados, decisiones y specs), para que la propuesta nueva
// no contradiga una regla vigente ni vuelva a preguntar lo que la persona ya decidió.

const seccion = (texto, titulo) => {
  const inicio = texto.search(new RegExp(`^## ${titulo}\\s*$`, "m"));
  if (inicio < 0) return [];
  return texto.slice(inicio).split(/\r?\n/).slice(1).join("\n").split(/^## /m)[0].split(/\r?\n/);
};

// Qué es el producto y el backlog de historias con lo que depende de qué (docs/propuesta.md §1 y §5).
export function productoYBacklog(rutaPropuesta) {
  const texto = leerSi(rutaPropuesta);
  const resumen = texto.match(/^La aplicación [^\n]+/m)?.[0] ?? null;
  const corta = (s) => {
    const limpia = s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    const frase = limpia.split(/[.:] /)[0];
    return frase.length > 160 ? `${frase.slice(0, 159)}…` : frase;
  };
  const historias = seccion(texto, "5\\. Backlog de historias de usuario")
    .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((c) => c.length >= 5)
    .map(([n, historia, fase, dependeDe, entrega]) => ({ n, historia: corta(historia), fase, dependeDe, entrega: corta(entrega) }));
  return { resumen, historias };
}

// Reglas de negocio y fuera de alcance de cada historia ya construida, desde su `issue.md` copiado a evidencias/issue-<n>/.
export function historiasConstruidas(dirEvidencias) {
  const num = (d) => Number(d.replace("issue-", ""));
  return listar(dirEvidencias)
    .filter((d) => /^issue-\d+$/.test(d) && existsSync(join(dirEvidencias, d, "issue.md")))
    .sort((a, b) => num(a) - num(b))
    .map((d) => {
      const texto = readFileSync(join(dirEvidencias, d, "issue.md"), "utf8");
      const viñetas = (titulo) => seccion(texto, titulo).filter((l) => /^\s*- /.test(l)).map((l) => l.replace(/\s+$/, ""));
      const decisiones = leerSi(join(dirEvidencias, d, "decisiones.md"))
        .split(/\r?\n/)
        .filter((l) => /^\|\s*\d+\s*\|/.test(l))
        .map((l) => l.split(/\s\|\s/).map((c) => c.replace(/^\||\|$/g, "").trim()))
        .filter((c) => c.length >= 6 && c[4] === "Persona")
        .map((c) => ({ numero: c[0], texto: c[3] }));
      return {
        issue: num(d),
        // Sin título (`# Issue #n: …`), la historia se identifica por su frase «Como … quiero …».
        titulo: (texto.match(/^# Issue #\d+:\s*(.+)$/m)?.[1] ?? seccion(texto, "Historia").find((l) => l.trim()) ?? d).trim().slice(0, 140),
        reglas: viñetas("Reglas de negocio"),
        fueraDeAlcance: viñetas("Fuera de alcance"),
        decisiones,
      };
    })
    .filter((h) => h.reglas.length || h.fueraDeAlcance.length || h.decisiones.length);
}

// Cada requisito de un spec con su texto completo y los nombres de sus escenarios.
export function requisitosDeSpec(texto) {
  return texto
    .split(/^### Requirement:\s*/m)
    .slice(1)
    .map((bloque) => {
      const [nombre, ...resto] = bloque.split(/\r?\n/);
      const cuerpo = resto.join("\n").split(/^#{2,4} /m)[0].trim();
      return {
        nombre: nombre.trim(),
        texto: cuerpo.split(/\r?\n\s*\r?\n/)[0].replace(/\s+/g, " "),
        escenarios: [...bloque.matchAll(/^#### Scenario:\s*(.+)$/gm)].map((m) => m[1].trim()),
      };
    });
}

// Reglas de comportamiento de cada capacidad, ya fusionadas (openspec/specs) o en curso (openspec/changes/<change>/specs).
// Las de plataforma y proceso (CI, despliegue, agentes…) se listan por nombre: no son reglas del producto.
export function reglasDeNegocio(raiz, plataforma = []) {
  const fuentes = [
    ...listar(join(raiz, "openspec", "specs")).map((c) => ({ capacidad: c, ruta: join(raiz, "openspec", "specs", c, "spec.md"), origen: "vigente" })),
    ...changesActivos(join(raiz, "openspec", "changes")).flatMap((ch) =>
      listar(join(raiz, "openspec", "changes", ch, "specs")).map((c) => ({
        capacidad: c,
        ruta: join(raiz, "openspec", "changes", ch, "specs", c, "spec.md"),
        origen: `en curso (${ch})`,
      })),
    ),
  ].filter((f) => existsSync(f.ruta));
  return fuentes.map((f) => {
    const texto = readFileSync(f.ruta, "utf8");
    return { capacidad: f.capacidad, origen: f.origen, plataforma: plataforma.includes(f.capacidad), proposito: propositoDe(texto), requisitos: requisitosDeSpec(texto) };
  });
}

export function plataformaConfigurada(raiz) {
  try {
    const cfg = JSON.parse(leerSi(join(raiz, ".claude", "orquestador.json")) || "{}");
    return Array.isArray(cfg.plataforma) ? cfg.plataforma : [];
  } catch {
    return [];
  }
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

const lista = (xs, vacio = "(ninguno)") => (xs.length ? xs.map((x) => `\`${x}\``).join(", ") : vacio);
const kb = (texto) => `${(Buffer.byteLength(texto) / 1024).toFixed(1)} KB`;
const lf = (texto) => texto.replace(/\r\n/g, "\n");

// ── Entradas ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// El contexto vive en `context/` (versionado) y solo crece: cada parte es una lista de entradas con una clave. Al correr el script se
// agrega la entrada que no existe y se reemplaza la que cambió; nunca se borra ninguna.

const ENTRADA = /<!-- entrada: (.+?) -->\n([\s\S]*?)\n<!-- fin -->/g;

export const entradasDe = (texto) => [...lf(texto).matchAll(ENTRADA)].map((m) => ({ id: m[1], texto: m[2] }));

const dibujar = ({ titulo, intro }, entradas) =>
  `${[titulo, "", intro, "", ...entradas.flatMap((e) => [`<!-- entrada: ${e.id} -->`, e.texto, "<!-- fin -->", ""])].join("\n")}`;

// Funde las entradas nuevas en el texto que ya existe: agrega, reemplaza lo que cambió y conserva el resto.
export function fusionar(existente, parte) {
  const entradas = entradasDe(existente);
  let agregadas = 0;
  let reemplazadas = 0;
  for (const entrada of parte.entradas) {
    // Las fuentes pueden venir con CRLF y dejar un `\r` suelto al final de una línea: sin quitarlo, cada corrida «cambiaría» la entrada.
    const nueva = { ...entrada, texto: entrada.texto.replace(/\r/g, "") };
    const i = entradas.findIndex((e) => e.id === nueva.id);
    if (i < 0) {
      entradas.push(nueva);
      agregadas += 1;
    } else if (entradas[i].texto !== nueva.texto) {
      entradas[i] = nueva;
      reemplazadas += 1;
    }
  }
  const texto = dibujar(parte, entradas);
  return { texto, agregadas, reemplazadas, cambiado: texto !== lf(existente) };
}

const unir = (lineas) => lineas.join("\n");

// ── Partes: qué entradas salen de cada fuente ──────────────────────────────────────────────────────────────────────────────────
const partesDeNegocio = (negocio) => {
  const porCapacidad = new Map();
  for (const c of negocio.filter((x) => !x.plataforma)) {
    const entradas = porCapacidad.get(c.capacidad) ?? new Map();
    entradas.set("proposito", { id: "proposito", texto: c.proposito || "(sin Purpose)" });
    for (const r of c.requisitos) {
      entradas.set(`requisito: ${r.nombre}`, {
        id: `requisito: ${r.nombre}`,
        texto: unir([`- **${r.nombre}** (${c.origen}): ${r.texto}`, ...(r.escenarios.length ? [`  - Escenarios: ${r.escenarios.join("; ")}`] : [])]),
      });
    }
    porCapacidad.set(c.capacidad, entradas);
  }
  return [...porCapacidad].map(([capacidad, entradas]) => ({
    ruta: `negocio/${capacidad}.md`,
    titulo: `# ${capacidad}`,
    intro: "Comportamiento ya especificado: `vigente` (en `openspec/specs/`) o `en curso` (en un change sin archivar). Cada requisito va con su texto completo y los nombres de sus escenarios; si una versión en curso reemplaza a la vigente, queda la más reciente. Si la historia cambia uno, su delta usa `## MODIFIED Requirements` con el nombre exacto.",
    entradas: [...entradas.values()],
  }));
};

export function partesDelContexto(raiz) {
  const producto = productoYBacklog(join(raiz, "docs", "propuesta.md"));
  const historias = historiasConstruidas(join(raiz, "evidencias"));
  const capacidades = capacidadesEspecificadas(join(raiz, "openspec", "specs"));
  const changes = changesActivos(join(raiz, "openspec", "changes"));
  const tablas = tablasDeMigraciones(join(raiz, "db", "migration"));
  const modulos = modulosConExtension(join(raiz, "src", "modulos"));
  const semillas = listar(join(raiz, "db", "seed")).filter((a) => a.endsWith(".sql"));
  const rutas = rutasDelContrato(join(raiz, "contracts", "openapi.yaml"));
  const referencia = moduloDeReferencia(raiz);
  const conv = convenciones(raiz);
  const env = entorno(raiz);
  const negocio = reglasDeNegocio(raiz, plataformaConfigurada(raiz));
  return [
    {
      ruta: "producto.md",
      titulo: "# Producto",
      intro: "Qué hace la aplicación y el backlog de historias (`docs/propuesta.md` §1 y §5): lo que cada una entrega y de cuál depende. Una historia que depende de otra no fusionada no puede suponer su tabla ni su módulo: es una pregunta.",
      entradas: [
        ...(producto.resumen ? [{ id: "resumen", texto: producto.resumen }] : []),
        ...producto.historias.map((h) => ({
          id: `historia ${h.n}`,
          texto: `- **#${h.n}** ${h.historia} — fase: ${h.fase}; depende de: ${h.dependeDe}; entrega: ${h.entrega}`,
        })),
      ],
    },
    {
      ruta: "historias.md",
      titulo: "# Reglas de negocio de las historias construidas",
      intro: "Copiadas del issue de cada historia (`evidencias/issue-<n>/issue.md`). Las reglas `RN-n`, lo que cada historia dejó fuera de alcance y las decisiones de la persona siguen vigentes; los números de decisión son los de ese issue.",
      entradas: historias.map((h) => ({
        id: `issue ${h.issue}`,
        texto: unir([
          `## #${h.issue} ${h.titulo}`,
          "",
          ...(h.reglas.length ? ["Reglas de negocio:", ...h.reglas] : []),
          ...(h.fueraDeAlcance.length ? ["Fuera de alcance:", ...h.fueraDeAlcance] : []),
          ...(h.decisiones.length ? ["Decisiones de la persona:", ...h.decisiones.map((d) => `- #${h.issue} decisión ${d.numero}: ${d.texto}`)] : []),
        ]),
      })),
    },
    {
      ruta: "inventario.md",
      titulo: "# Inventario del repositorio",
      intro: "Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto. Si la historia cambia una capacidad, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito.",
      entradas: [
        ...capacidades.map((c) => ({ id: `capacidad ${c.capacidad}`, texto: `- Capacidad \`${c.capacidad}\`: ${c.proposito || "(sin Purpose)"} Requisitos: ${c.requisitos.join("; ") || "(ninguno)"}.` })),
        ...changes.map((c) => ({ id: `change ${c}`, texto: `- Change en curso \`openspec/changes/${c}/\`.` })),
        ...[...tablas].map(([t, v]) => ({ id: `tabla ${t}`, texto: `- Tabla \`${t}\`: ${[...new Set(v.columnas)].join(", ")} (${v.migraciones.join(", ")}).` })),
        ...modulos.map((m) => ({ id: `modulo ${m.modulo}`, texto: `- Módulo \`${m.modulo}\`: puntos de extensión ${m.puntos.join(", ") || "(ninguno)"}.` })),
        ...semillas.map((s) => ({ id: `semilla ${s}`, texto: `- Semilla \`db/seed/${s}\`.` })),
        ...rutas.map((r) => ({ id: `ruta ${r.ruta}`, texto: `- Ruta \`${r.ruta}\`: ${r.metodos.join(", ")}.` })),
      ],
    },
    {
      ruta: "codigo.md",
      titulo: "# Código existente",
      intro: "Patrón a seguir y nombres reales para no explorar el repo. El módulo de referencia son rutas, no contenido: léelas antes de escribir y no copies lo que no aplique. Las firmas son la primera línea de cada `export`; abre el archivo solo si la firma no alcanza. Lo compartido se reutiliza y no se edita (un componente reutilizable nuevo va en `src/modulos/ui/`).",
      entradas: [
        ...(referencia
          ? [{ id: "modulo de referencia", texto: unir([`- Módulo de referencia: \`${referencia.modulo}\``, ...referencia.archivos.map(([rol, ruta]) => `  - ${rol}: \`${ruta}\``)]) }]
          : []),
        ...firmasPublicas(join(raiz, "src", "modulos")).map((f) => ({ id: `firmas ${f.modulo}/${f.archivo}`, texto: unir([`- \`${f.modulo}/${f.archivo}\``, ...f.firmas.map((s) => `  - \`${s}\``)]) })),
        ...firmasCompartidas(raiz).map((f) => ({ id: `compartido ${f.ruta}`, texto: unir([`- Compartido \`${f.ruta}\``, ...f.firmas.map((s) => `  - \`${s}\``)]) })),
      ],
    },
    {
      ruta: "convenciones.md",
      titulo: "# Convenciones y herramientas",
      intro: "Lo que el código ya hace: repítelo con los mismos nombres (los de archivos, componentes y pruebas siguen los del módulo de referencia de `codigo.md`). Las librerías son las fijas del proyecto: no se agrega ninguna sin aprobación.",
      entradas: [
        { id: "nombres", texto: `- Nombres en español, sin tildes en archivos y carpetas. Módulos: ${lista(conv.modulos)}. Componentes de \`ui/\` en PascalCase (${conv.componentes.siguen} de ${conv.componentes.total}); pruebas en kebab-case (${conv.pruebasKebab.siguen} de ${conv.pruebasKebab.total}); migraciones \`V<AAAAMMDDHHmm>__descripcion.sql\`.` },
        { id: "ultima migracion", texto: `- Última migración: ${conv.ultimaMigracion ? `\`${conv.ultimaMigracion}\` (la nueva usa una versión \`V<AAAAMMDDHHmm>\` posterior)` : "(ninguna)"}` },
        { id: "errores", texto: `- Mensajes de error de servicio (estado y texto): ${conv.mensajesDeError.length ? conv.mensajesDeError.map((m) => `\`${m}\``).join("; ") : "(ninguno)"}` },
        { id: "data-testid", texto: `- \`data-testid\` en uso: ${lista(conv.testIds)}` },
        { id: "clases", texto: `- Clases del sistema de diseño (\`globals.css\`): ${conv.clases.length ? conv.clases.map((c) => `\`.${c}\``).join(", ") : "(ninguna)"}` },
        { id: "tokens", texto: `- Tokens de diseño (\`globals.css\`): ${lista(env.tokens)}` },
        { id: "librerias", texto: `- Librerías: ${lista(env.dependencias)}` },
        { id: "desarrollo", texto: `- Desarrollo: ${lista(env.dependenciasDev)}` },
        { id: "scripts", texto: `- Scripts: ${lista(env.scripts)}` },
        { id: "vitest", texto: `- Pruebas unitarias e integración (Vitest, proyectos): ${lista(env.proyectosVitest)}. Una prueba de integración va en \`*.int.test.ts\`; \`server-only\` se simula con \`src/test/vacio.ts\`.` },
        { id: "playwright", texto: `- Pruebas e2e (Playwright): carpeta \`${env.e2e.directorio ?? "(ninguna)"}\`, contra una app ya levantada en \`BASE_URL\` (por defecto \`${env.e2e.baseUrl ?? "(ninguna)"}\`).` },
        { id: "postgres", texto: `- Postgres: \`${env.postgres ?? "(ninguno)"}\`, acceso con \`pg\` y SQL a mano solo en \`repo.ts\`. Tipos usados en las migraciones: ${lista(env.tiposSql)}.` },
        { id: "flyway", texto: `- Flyway: \`${env.flyway.imagen ?? "(ninguno)"}\`, lee \`${env.flyway.carpeta ?? "(ninguna)"}\` (\`docker compose run --rm flyway migrate info\`). Modismos de las migraciones: ${env.modismosSql.length ? env.modismosSql.join("; ") : "(ninguno)"}.` },
      ],
    },
    ...partesDeNegocio(negocio),
  ];
}

// ── Índice ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const RESUMEN_DE_PARTES = [
  ["producto.md", "resumen y backlog de historias con sus dependencias"],
  ["historias.md", "RN, fuera de alcance y decisiones de la persona de cada historia construida"],
  ["inventario.md", "capacidades, changes activos, tablas, módulos, semillas y rutas"],
  ["codigo.md", "módulo de referencia, firmas públicas y lo compartido"],
  ["convenciones.md", "convenciones del repo, librerías, Vitest, Playwright, Postgres, Flyway y diseño"],
];

const PASOS_DEL_INDICE = [
  ["3 Propuesta (la sesión)", "`producto.md`, `historias.md`, `inventario.md` y `negocio/<capacidad>.md` de las capacidades del issue"],
  ["4 Revisar la propuesta (`revisor-salida`)", "`inventario.md`, `historias.md` y `negocio/<capacidad>.md` de las capacidades del change"],
  ["5 Implementar (la sesión)", "`codigo.md`, `convenciones.md` y, si hay duda, `negocio/<capacidad>.md`"],
  ["5 Escribir pruebas (`escritor-pruebas`)", "`codigo.md`, `convenciones.md` y `negocio/<capacidad>.md` de la capacidad del change"],
];

// El índice se arma con lo que hay en disco después de fundir, para que incluya también lo acumulado.
export function indiceDelContexto(destino, plataforma = []) {
  const leer = (ruta) => lf(leerSi(join(destino, ruta)));
  const capacidades = listar(join(destino, "negocio")).filter((f) => f.endsWith(".md"));
  return `${unir([
    "# Contexto del repositorio",
    "",
    "Contexto acumulado del producto, versionado en `context/`. `contexto.mjs` lo **amplía**: agrega lo nuevo y reemplaza solo la entrada que cambió, sin borrar nada ni regenerarlo entero. Lee este índice y, de las partes, solo las que tu paso indica. Empieza por el **negocio** (qué promete ya el producto, qué reglas rigen y qué decidió la persona) y sigue con lo **técnico**. Toda tabla, columna o módulo que use la propuesta debe aparecer en las partes; si no aparece, es una pregunta, no un supuesto. Una regla nueva no contradice una vigente: si la historia cambia una, su delta es `## MODIFIED Requirements` y se le pregunta a la persona. Las reglas de `CLAUDE.md` ya están cargadas: no se repiten aquí.",
    "",
    "## Qué leer en cada paso",
    "",
    "| Paso | Lee (en `context/`) |",
    "|---|---|",
    ...PASOS_DEL_INDICE.map(([paso, lee]) => `| ${paso} | ${lee} |`),
    "",
    "Qué capacidades leer: las que el issue nombra o cuyo módulo toca (un issue sobre sensores lee `nodos-y-sensores`). Ante la duda, lee de más: una regla que falta cuesta más que un archivo de sobra. Varias lecturas van en un mismo mensaje.",
    "",
    "## Partes",
    "",
    "| Archivo | Contenido | Tamaño |",
    "|---|---|---|",
    ...RESUMEN_DE_PARTES.map(([ruta, resumen]) => `| \`context/${ruta}\` | ${resumen} | ${kb(leer(ruta))} |`),
    "",
    "## Capacidades de negocio",
    "",
    "Cada una tiene su parte con los requisitos completos y los nombres de sus escenarios.",
    "",
    "| Capacidad | Propósito | Parte | Tamaño |",
    "|---|---|---|---|",
    ...capacidades.map((f) => {
      const texto = leer(`negocio/${f}`);
      const proposito = entradasDe(texto).find((e) => e.id === "proposito")?.texto ?? "(sin Purpose)";
      return `| ${f.replace(/\.md$/, "")} | ${proposito} | \`context/negocio/${f}\` | ${kb(texto)} |`;
    }),
    ...(capacidades.length ? [] : ["| (ninguna) | | | |"]),
    "",
    "## Plataforma y proceso (solo nombres)",
    "",
    "No son reglas del producto: van solo por nombre (sus requisitos están en `inventario.md`). La lista está en `plataforma` de `.claude/orquestador.json`; una capacidad nueva cuenta como negocio hasta que se agregue ahí.",
    "",
    plataforma.length ? lista(plataforma) : "(ninguna)",
  ])}\n`;
}

// Amplía `destino` con lo que las fuentes tienen de nuevo. No escribe nada si no hay novedades.
export function ampliarContexto(raiz, destino) {
  let agregadas = 0;
  let reemplazadas = 0;
  const escritos = [];
  for (const parte of partesDelContexto(raiz)) {
    const ruta = join(destino, parte.ruta);
    const r = fusionar(leerSi(ruta), parte);
    agregadas += r.agregadas;
    reemplazadas += r.reemplazadas;
    if (r.cambiado) {
      mkdirSync(dirname(ruta), { recursive: true });
      writeFileSync(ruta, r.texto);
      escritos.push(parte.ruta);
    }
  }
  const indice = indiceDelContexto(destino, plataformaConfigurada(raiz));
  const rutaIndice = join(destino, "contexto.md");
  if (lf(leerSi(rutaIndice)) !== indice) {
    mkdirSync(destino, { recursive: true });
    writeFileSync(rutaIndice, indice);
    escritos.push("contexto.md");
  }
  return { agregadas, reemplazadas, escritos };
}

if (esPrincipal(import.meta.url)) {
  const o = opciones(process.argv.slice(2));
  const raiz = o.raiz ?? raizRepo();
  const r = ampliarContexto(raiz, o.destino ?? join(raiz, "context"));
  console.log(r.escritos.length ? `Contexto ampliado en context/: ${r.agregadas} entradas nuevas, ${r.reemplazadas} reemplazadas (${r.escritos.join(", ")})` : "Contexto al día: sin novedades");
}
