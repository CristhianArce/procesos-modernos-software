# Design

## Context

La HU 8 ya dejó en `main` la tabla `nodo_usuarios` (alias de 1 a 80 caracteres con CHECK), el módulo `src/modulos/afectados/` (`repo.listarPorNodo`, `service.listarAfectados`, `schema.afectadosConsultaSchema`, panel declarado en `paneles.ts`) y `GET /api/afectados`. Esta historia solo agrega la escritura (CA-1 a CA-4). Motivación en `proposal.md`; requisitos en `specs/agregar-afectado-nodo/spec.md`. Sigue el mismo patrón que `sensores` (`POST /api/sensores`, `FormularioSensor`).

## Goals / Non-Goals

**Goals:**
- `POST /api/afectados` delgado: autoriza, valida con Zod, llama al servicio y responde 201.
- Formulario de alta en el panel existente, visible solo para el administrador.

**Non-Goals:**
- Migración, semilla, `GET` nuevo, quitar afectados (HU 15), edición de alias, unicidad de alias.
- Editar `paneles.ts`, la página de la ficha o el núcleo.

## Decisions

- **Alias máximo 80** (Derivado: decisión #1): coincide con el CHECK inmutable de la tabla y con el requisito vigente «Datos de un afectado». Alternativa descartada: 100, que exigía migración y modificar el spec vigente.
- **Solo POST y formulario** (Derivado: decisión #2): se reutilizan tabla, repo, servicio y panel de la HU 8.
- **`POST /api/afectados` con `nodoId` en el cuerpo, en el mismo `route.ts` que el `GET`** (Derivado: decisión #3): igual que `sensores`. Alternativa descartada: `POST /api/nodos/{id}/afectados`.
- **Orden de comprobaciones en el handler:** `requireRole(..., "administrador")` primero (401/403 antes de validar, CA-4), luego Zod (400, CA-2) y por último el servicio, que llama a `obtenerNodo` (404, CA-3) antes de insertar. Nada se guarda en ningún fallo.
- **Recorte del alias en Zod** (`z.string().trim().min(1).max(80)`): el valor guardado ya viene recortado, y el CHECK de la BD (`btrim`) queda como red de seguridad.
- **Formulario `"use client"`** que usa `enviarJson` (`@/modulos/nodos/ui/enviar-json`) y `router.refresh()` para releer la lista y el total en el servidor. No importa Zod ni código de servidor.
- **Rol en el panel:** `AfectadosDelNodo` (Server Component) lee `sesionActual()` junto con `listarAfectados` y muestra el formulario solo si `rol === "administrador"`. Es cosmético: la API exige el rol.
- **Sin semilla** (Derivado: decisión #4): N0 empieza sin afectados.

Componentes de `src/modulos/ui/` que se reutilizan: `Cargando`, `EstadoError` y `EstadoVacio` (ya usados por el panel) y `ListaAfectados`. Componente nuevo propio del módulo: `FormularioAfectado` (en `afectados/ui/`). Estados del formulario: enviando (botón deshabilitado), error (`role="alert"`) y éxito (campo vacío y datos releídos). La lista conserva su estado de carga, error y vacío.

## Firmas

- `repo.crear(nodoId: string, alias: string): Promise<Afectado>` — `INSERT INTO nodo_usuarios (nodo_id, alias) VALUES ($1, $2) RETURNING id, alias`.
- `service.crearAfectado(entrada: AfectadoCrear): Promise<Afectado>` — llama a `obtenerNodo(entrada.nodoId)` (404 `Nodo no encontrado`) y luego a `repo.crear`.
- `schema.afectadoCrearSchema = z.object({ nodoId: z.guid(), alias: z.string().trim().min(1).max(80) })` y `type AfectadoCrear = z.infer<typeof afectadoCrearSchema>`.
- Handler `POST` de `src/app/api/afectados/route.ts`: `requireRole(await sessionFromRequest(req), "administrador")`, `afectadoCrearSchema.parse(await req.json().catch(() => undefined))`, `Response.json(await crearAfectado(entrada), { status: 201 })`, dentro de `conHttp("/api/afectados", ...)`.
- Respuesta 201: `{ id: string (uuid), alias: string }`. Errores en JSON: 400 `{ error: "Datos inválidos", detalles }`, 401, 403, 404 `Nodo no encontrado`.
- `FormularioAfectado({ nodoId }: { nodoId: string })` en `src/modulos/afectados/ui/FormularioAfectado.tsx`. `data-testid="formulario-afectado"` en el `<form>`; campo con etiqueta «Alias» (`name="alias"`, `required`, `maxLength={80}`); botón «Agregar afectado»; error con `role="alert"`.
- Se conservan `data-testid="afectados-total"`, `afectados-lista` y `afectado` de `ListaAfectados`.
- Contrato: `POST /api/afectados` con cuerpo `AfectadoCrear` (`required: [nodoId, alias]`, `alias` de 1 a 80, `nodoId` uuid), respuestas 201 (`Afectado`), 400, 401, 403 y 404 con los `$ref` existentes; el `GET` se conserva.

## Textos visibles

- Título del formulario: «Agregar afectado»; etiqueta del campo: «Alias»; botón: «Agregar afectado» (deshabilitado mientras envía).
- Error de la API: el mensaje de `enviarJson` (por ejemplo `Datos inválidos — alias: …`) en una alerta bajo el campo; error de red: `No se pudo conectar con el servidor.`
- Se conservan «Total de afectados: N», el estado vacío «Este nodo no tiene afectados» y el error «No se pudieron cargar los afectados».
- El técnico no ve el título, el campo ni el botón.

## Risks / Trade-offs

- [Un 400 por alias solo con espacios podría dar un mensaje técnico de Zod] → se muestra el detalle `alias: …` tal cual lo devuelve la API, como en el formulario de sensores.
- [Una prueba e2e que cuente totales sobre N0 compartido] → la prueba usa un alias único con `Date.now()` y no afirma el total global; el contador del issue (0 → 1) se acota con un nodo creado por la propia prueba.
