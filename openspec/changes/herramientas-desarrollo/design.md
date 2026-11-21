# Design

## Context

El repositorio no tiene código de aplicación. El stack es fijo (`CLAUDE.md` §3) y la estructura y las capas también (§4). El orquestador de la HU 1a ya espera los scripts `typecheck`, `test:unit` y `test:integration`, y su `contexto.mjs` lee `src/modulos/*/{menu,paneles,on-alerta,metrics}.ts`, `db/migration/`, `db/seed/` y `contracts/openapi.yaml`. No hay base de datos hasta la HU 2, así que nada de esta historia necesita Postgres para sus pruebas.

## Goals / Non-Goals

**Goals:**
- Un núcleo pequeño (`src/lib`, `src/nav`, `proxy.ts`) que las historias usan y nunca editan.
- Que cada pieza del núcleo se pruebe sin BD ni servidor: los handlers con `Request` en Vitest.

**Non-Goals:**
- Página de login y tabla de usuarios (HU 3). `proxy.ts` redirige a `/login` aunque esa página aún no exista.
- Rate limiting: `rate-limit.ts` lo agrega la historia que lo necesite (HU 3).

## Decisions

1. **Configuración de Next.** `next.config.ts` con `output: "standalone"` (la imagen de la HU 2), `poweredByHeader: false`, `cacheComponents: false` y cabeceras CSP, HSTS, `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff` para todas las rutas. La CSP usa `script-src 'self' 'unsafe-inline'` porque Next inyecta scripts en línea; en desarrollo agrega `'unsafe-eval'`. Alternativa descartada: CSP con nonce por petición, que obliga a que todas las páginas sean dinámicas y complica `proxy.ts`.
2. **Versiones.** Se genera con `create-next-app@16.4.6` en una carpeta temporal (choca con el `README.md`) y se copia. Las dependencias se instalan con versión exacta (`save-exact`). TypeScript, ESLint y Tailwind quedan en las versiones que trae esa plantilla, no en la última publicada: TypeScript 7 todavía puede no ser compatible con Next 16.
3. **Registro de extensiones.** `src/nav/registro.ts` separa dos partes: una función pura `construirRegistro(modulos)` que recibe un mapa `ruta → exports` y devuelve menú (ordenado por `orden`), paneles y suscriptores; y el descubrimiento, que produce ese mapa. Las pruebas de CA-4 llaman a la función pura con un módulo de prueba, así que no dependen del mecanismo de descubrimiento. Para descubrir se prueba `import.meta.glob` bajo Turbopack y Vitest, con un tope de 30 minutos. Si no funciona en los dos, se usa un `src/nav/modulos.ts` con una línea de import por módulo: es el único archivo que cada historia toca, y su conflicto se resuelve conservando las líneas de ambos lados, igual que `contracts/openapi.yaml`. **Resultado:** `import.meta.glob` con `{ eager: true }` funciona en Turbopack (documentado en `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md` y verificado con `next build` y `next start`) y en Vitest, así que no se usa el respaldo.
4. **Sesión.** La cookie `sesion` (`HttpOnly`, `SameSite=Lax`, `Secure` en producción) es un JWT HS256 firmado con `jose` usando `SESSION_SECRET`, con `sub` y `rol` (`administrador` o `tecnico`) y vencimiento de 8 horas. `src/lib/session.ts` firma y verifica. `src/lib/dal.ts` expone `sessionFromRequest(req)` y `requireRole(sesion, ...roles)`, que lanzan `ErrorHttp(401)` o `ErrorHttp(403)`. Crear la sesión (login) es de la HU 3.
5. **`proxy.ts`.** Verifica la firma de la cookie y redirige a `/login` si falta o es inválida. Su `matcher` excluye `/api/**`, `/login`, `/_next/**` y los archivos estáticos. La API nunca depende de `proxy.ts`: cada handler llama a `sessionFromRequest` + `requireRole` (`CLAUDE.md` §6).
6. **Salud.** `GET /api/health` devuelve `{ "status": "ok", "version": "<version de package.json>" }`. Resuelve la pregunta abierta del issue #2 con la opción b, sin el estado de la BD: la HU 2 lo agrega cuando exista `db`. La versión se importa de `package.json`, porque `npm_package_version` no existe en la imagen standalone.
7. **Envoltorio de handlers.** `src/lib/http.ts` exporta `conHttp(ruta, handler)`: mide la duración, traduce `ErrorHttp` y los errores de Zod a JSON (`{ "error": "<mensaje>" }`), convierte cualquier otro error en 500 sin detalle, incrementa las métricas y registra una línea con `metodo`, `ruta`, `estado` y `ms`. El envoltorio nunca lee el cuerpo, así que no puede registrarlo. `ruta` es la plantilla (`/api/nodos/[id]`), no la URL real, para no disparar la cardinalidad de las métricas.
8. **Logs.** `src/lib/logger.ts` es una instancia de `pino` con `redact` para `password`, `token`, `authorization` y `cookie` como segunda defensa. ESLint prohíbe `console.log` (`no-console`).
9. **Métricas.** `src/lib/metrics.ts` guarda el registro de `prom-client` en `globalThis` (el recargado en caliente de desarrollo lo duplicaría) con `http_requests_total{metodo,ruta,estado}`, `http_request_duration_seconds` y las métricas por defecto. `GET /api/metrics` compara el token con `timingSafeEqual`; si `METRICS_TOKEN` no está definido, siempre responde 401.
10. **Pruebas.** `vitest.config.mts` con dos proyectos: `unit` (`src/**/__tests__/*.test.ts`) e `integration` (`src/**/__tests__/*.int.test.ts`, handlers llamados con `new Request(...)`). `server-only` se aliasa a un módulo vacío. Playwright solo trae `e2e/health.spec.ts` (`@smoke`) contra `BASE_URL`.
11. **Exclusiones.** `.claude/` completa (incluye `.claude/worktrees/`) y `.flujo/` quedan fuera en `tsconfig.json` (`exclude`), `eslint.config.mjs` (`ignores`) y `vitest.config.mts` (`exclude`), además de `.gitignore`. Se excluye `.claude/` entera porque sus fixtures traen `.ts` que no compilan a propósito y sus scripts se prueban con `node --test`.
12. **Semilla.** `scripts/seed.mjs` (`npm run seed`) aplica en orden alfabético los `db/seed/*.sql` con `pg` sobre `DATABASE_URL`, cada archivo en una transacción. Si no hay archivos, lo informa y termina con 0. La idempotencia es responsabilidad de cada semilla (`ON CONFLICT DO NOTHING`); la HU 2 la verifica (su CA-3).

## Risks / Trade-offs

- [`import.meta.glob` no funciona en Turbopack] → respaldo de la decisión #3, con un tope de 30 minutos.
- [La CSP con `'unsafe-inline'` es más débil que una con nonce] → se acepta para la entrega; el resto de cabeceras queda igual. Mejora futura: CSP con nonce en `proxy.ts`.
- [El JWT no se puede revocar antes de que venza] → vencimiento corto de 8 horas. La revocación queda fuera de alcance.
- [Redirigir a `/login` da 404 hasta la HU 3] → se acepta: la HU 3 crea la página y no hay datos que mostrar antes.
