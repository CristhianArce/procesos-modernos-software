# Tasks

## 1. Herramientas (modo práctica)

- [x] 1.1 Crear `package.json` (scripts `typecheck` y `test:unit`; dependencias `zod`, `react`, `react-dom`; desarrollo `typescript`, `vitest`, `@types/react`, `@types/react-dom`, `@types/node`), `tsconfig.json` y `vitest.config.ts`, y correr `npm install`; se verifica con `npm run typecheck` sin errores (Derivado: decisión #1)

## 2. Schema y service

- [x] 2.1 Escribir primero `src/modulos/acerca/__tests__/service.test.ts` con `it("#6 CA-1: devuelve nombre y version no vacíos")` y luego `schema.ts` (`acercaSchema` con Zod) y `service.ts` (`obtenerAcerca()` con contenido fijo, RN-1); se verifica con `npm run test:unit` en verde (CA-1)

## 3. Handler

- [x] 3.1 Escribir primero `src/modulos/acerca/__tests__/handler.test.ts` con `it("#6 CA-1: responde 200 con nombre y version a un administrador")` e `it("#6 CA-1: responde 200 con nombre y version a un técnico")`, y luego `src/modulos/acerca/handler.ts` (`crearGetAcerca(obtenerSesion)`); se verifica con `npm run test:unit` en verde (CA-1)
- [x] 3.2 Agregar a `handler.test.ts` `it("#6 CA-3: responde 401 con JSON de error sin sesión")`, que también comprueba que el cuerpo no trae `nombre` ni `version`, y hacerla pasar; se verifica con `npm run test:unit` en verde (CA-3)
- [x] 3.3 Crear `src/app/api/acerca/route.ts` que exporta `GET = crearGetAcerca(sinSesion)` (falla cerrado hasta la HU 1b) y su prueba `it("#6 CA-3: la ruta sin sesión responde 401")` en `src/modulos/acerca/__tests__/route.test.ts`; se verifica con `npm run test:unit` en verde (CA-3, Derivado: decisión #2)

## 4. Página / ui

- [x] 4.1 Escribir primero `src/modulos/acerca/__tests__/pagina.test.tsx` con `it("#6 CA-2: la página muestra el nombre y la versión")` (render con `react-dom/server`) y luego `src/app/(tablero)/acerca/page.tsx`; se verifica con `npm run test:unit` en verde (CA-2)

## 5. menu.ts

- [x] 5.1 Escribir primero `src/modulos/acerca/__tests__/menu.test.ts` con `it("#6 CA-2: el técnico ve el ítem Acerca de que lleva a /acerca")` y luego `src/modulos/acerca/menu.ts`; se verifica con `npm run test:unit` en verde (CA-2)

## 6. Integración y aceptación de la historia

- [x] 6.1 Correr `npm run typecheck` y `npm run test:unit` completos y confirmar que hay al menos una prueba por cada CA (`#6 CA-1`, `#6 CA-2`, `#6 CA-3`); se verifica con ambos comandos en verde (CA-1, CA-2, CA-3)

## Workflow follow-up

- Abrir el PR en borrador; es una historia de práctica y su PR no se fusiona.
- Cuando exista la HU 1b: conectar `route.ts` con `sessionFromRequest` + `requireRole` y el envoltorio de `src/lib/http.ts`, agregar `GET /api/acerca` a `contracts/openapi.yaml`, registrar el menú y escribir la prueba e2e de `/acerca`.
- No se archiva: el PR de práctica se cierra sin fusionar.
