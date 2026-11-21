# Clon limpio (HU 1b, #2, tarea 7.1)

Fecha: 2026-11-21. Node 24.13.0, npm 11.6.2, macOS.

Se copiaron a una carpeta vacía solo los archivos que van a git (`git ls-files` más los nuevos no ignorados), sin `node_modules`, `.next` ni `next-env.d.ts`, y se corrió:

| Comando | Código de salida |
|---|---|
| `npm ci` | 0 |
| `npm run lint` | 0 |
| `npm run typecheck` | 0 |
| `npm run test:unit` | 0 (31 pruebas; 41 tras agregar `herramientas.test.ts`) |
| `npm run test:integration` | 0 (10 pruebas) |
| `npm run build` | 0 |

**Rechazo documentado:** el primer intento falló en `npm ci` porque `package-lock.json` había quedado desincronizado tras una instalación fallida (`vitest@5.1.1` publicado sin `@vitest/spy@5.1.1` en ese momento). Se regeneró el lockfile con `npm install`, se verificó con `npm ci --dry-run` y el segundo intento pasó.

## Verificaciones manuales adicionales

- **CA-7:** con `.claude/worktrees/roto/src/x.ts` (error de tipos y `console.log`) y `.flujo/issue-0/x.test.ts` (prueba que falla), `typecheck`, `lint`, `test:unit` y `test:integration` terminaron con 0. El mismo error de tipos en `src/roto.ts` sí lo detectó `typecheck` (`TS2322`).
- **App compilada (`next start`):** `GET /api/health` da 200 `{"status":"ok","version":"0.1.0"}` con CSP, HSTS, `X-Frame-Options` y `X-Content-Type-Options`; `GET /api/metrics` sin token da 401 en JSON y con token da `http_requests_total` por método, ruta y estado; `/` sin sesión da 307 a `/login`; `/` con sesión de `tecnico` da 200 con el ítem "Inicio" descubierto con `import.meta.glob` bajo Turbopack.
- **Smoke:** `BASE_URL=http://localhost:3999 npm run e2e` pasó (`@smoke la app responde en /api/health`).
- **Mutaciones:** quitar `api` del matcher de `proxy.ts` hace fallar 2 pruebas; vaciar el `redact` del logger hace fallar 1. Las pruebas detectan esas regresiones.
- **Semilla:** sin `DATABASE_URL` termina con 1 y mensaje claro; sin archivos en `db/seed/` imprime "No hay semillas" y termina con 0.
