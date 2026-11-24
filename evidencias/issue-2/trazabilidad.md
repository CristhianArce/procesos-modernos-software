# Trazabilidad HU 1b (#2) · Change: herramientas-desarrollo

| CA | Requisito (spec) | Tareas | Archivos | Pruebas |
|---|---|---|---|---|
| CA-1 | `calidad-proyecto`: Comandos de calidad en verde desde un clon limpio | 1.1–1.4, 7.1 | `package.json`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.mts` | `src/__tests__/herramientas.test.ts`, `evidencias/issue-2/pruebas/clon-limpio.md`, job `proyecto` del CI |
| CA-2 | `observabilidad`: Salud de la app sin autenticación | 4.1, 4.3, 7.2 | `src/app/api/health/route.ts`, `contracts/openapi.yaml` | `src/app/api/__tests__/health.int.test.ts`, `src/__tests__/contrato.test.ts`, `e2e/health.spec.ts` |
| CA-3 | `observabilidad`: Métricas protegidas por token | 2.2, 4.2, 4.3 | `src/lib/metrics.ts`, `src/app/api/metrics/route.ts` | `src/lib/__tests__/metrics.test.ts`, `src/app/api/__tests__/metrics.int.test.ts` |
| CA-4 | `extension-modulos`: Descubrimiento de extensiones por módulo; Menú filtrado por rol | 3.1, 3.2 | `src/nav/registro.ts`, `src/modulos/inicio/menu.ts` | `src/nav/__tests__/registro.test.ts` |
| CA-5 | `observabilidad`: Log estructurado de cada petición sin datos sensibles | 2.1, 2.3 | `src/lib/http.ts`, `src/lib/logger.ts`, `src/lib/errores.ts` | `src/lib/__tests__/http.test.ts`, `src/lib/__tests__/logger.test.ts` |
| CA-6 | `acceso-tablero`: Páginas del tablero redirigen sin sesión; API protegida responde 401 y 403 en JSON | 2.4, 5.1, 5.2 | `src/proxy.ts`, `src/lib/session.ts`, `src/lib/dal.ts`, `src/app/(tablero)/layout.tsx` | `src/__tests__/proxy.test.ts`, `src/lib/__tests__/session.test.ts`, `src/app/api/__tests__/acceso.int.test.ts` |
| CA-7 | `calidad-proyecto`: Carpetas de trabajo de los agentes ignoradas | 1.5 | `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `.gitignore` | `src/__tests__/herramientas.test.ts`, verificación manual en `evidencias/issue-2/pruebas/clon-limpio.md` |

Derivados: decisión #1 (cabeceras, `src/__tests__/next-config.int.test.ts`), #12 (semilla, `scripts/seed.mjs`).

Verificado con `node .claude/skills/orquestador/scripts/trazabilidad-grep.mjs evidencias/issue-2/issue.md openspec/changes/herramientas-desarrollo --pruebas 2`: `sinCobertura`, `tareasSinCriterio`, `bloquesSinCriterio` vacíos; `sinPrueba` vacío (cada CA tiene al menos una prueba que cita `#2 CA-k`).
