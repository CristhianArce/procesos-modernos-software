# Verificación — issue #27

## Build (intento 1)

- `build-test.mjs 27`: **falló** en `typecheck`, clasificación **código**.
- Error: `src/app/api/__tests__/mantenimiento.int.test.ts(72,62)` y `(72,78)`: TS2339, `cuerpo` y `crudo` no existen en la unión de casos de `it.each`.
- Corrección (paso 7): el caso pasa la entrada con spread a `peticion` (`{ rol: "administrador", ...entrada }`), como en `aislamiento.int.test.ts`, y `asignar` deja de recibir `crudo`.

## Build (intento 2)

- `build-test.mjs 27`: **BUILD SUCCESS** (`typecheck` y `test:unit`), log `.flujo/issue-27/build-20261124-184347.log`.

## revisor-reglas

Rama: feature/issue-27-asignar-tecnico-nodo · Archivos: 22 · CRITICAL: 0 · WARNING: 0 · SUGGESTION: 0 · Veredicto: listo.

| # | Severidad | Archivo | Hallazgo | Estado |
|---|---|---|---|---|
| - | - | - | Sin hallazgos | - |

Limitación declarada por el revisor: no leyó las pruebas unitarias ni las de integración contra la regla de nombres (la cubre `trazabilidad-grep --pruebas`).

## Pruebas

Pruebas: CA-1, CA-2, CA-3 y CA-4 con prueba (`sinPrueba` vacío en `trazabilidad.md`). Integración y e2e escritas, pendientes del CI del PR.
