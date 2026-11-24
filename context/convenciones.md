# Convenciones y herramientas

Lo que el código ya hace: repítelo con los mismos nombres (los de archivos, componentes y pruebas siguen los del módulo de referencia de `codigo.md`). Las librerías son las fijas del proyecto: no se agrega ninguna sin aprobación.

<!-- entrada: nombres -->
- Nombres en español, sin tildes en archivos y carpetas. Módulos: `aislamiento`, `alertas`, `auth`, `dashboard`, `estado`, `inicio`, `lecturas`, `nodos`, `sensores`, `simulador`, `topologia`, `ui`. Componentes de `ui/` en PascalCase (20 de 20); pruebas en kebab-case (60 de 60); migraciones `V<AAAAMMDDHHmm>__descripcion.sql`.
<!-- fin -->

<!-- entrada: ultima migracion -->
- Última migración: `V202611222330__topologia.sql` (la nueva usa una versión `V<AAAAMMDDHHmm>` posterior)
<!-- fin -->

<!-- entrada: errores -->
- Mensajes de error de servicio (estado y texto): `401 No autenticado`; `401 Token de métricas inválido`; `403 Sin permiso`; `404 Enlace no encontrado`; `404 Nodo no encontrado`; `404 Sensor no encontrado`; `409 Ya existe un enlace entre esos nodos`
<!-- fin -->

<!-- entrada: data-testid -->
- `data-testid` en uso: `alerta`, `ultima-lectura`
<!-- fin -->

<!-- entrada: clases -->
- Clases del sistema de diseño (`globals.css`): `.aviso`, `.boton-fantasma`, `.boton-primario`, `.campo`, `.cifra`, `.enlace`, `.esqueleto`, `.etiqueta-campo`, `.fondo-reticula`, `.mimico-enlace`, `.mimico-enlace-golpe`, `.mimico-flujo`, `.mimico-nodo`, `.mimico-nombre`, `.mimico-reticula`, `.mimico-valor`, `.subtitulo-pagina`, `.tabla`, `.titulo-pagina`
<!-- fin -->

<!-- entrada: tokens -->
- Tokens de diseño (`globals.css`): `--sc-acento`, `--sc-acento-fuerte`, `--sc-advertencia`, `--sc-borde`, `--sc-borde-fuerte`, `--sc-critico`, `--sc-desconectado`, `--sc-esp`, `--sc-estado`, `--sc-flujo`, `--sc-foco`, `--sc-fondo`, `--sc-fondo-2`, `--sc-fuente`, `--sc-fuente-mono`, `--sc-normal`, `--sc-panel`, `--sc-panel-2`, `--sc-radio`, `--sc-radio-lg`, `--sc-sin-datos`, `--sc-sombra`, `--sc-texto`, `--sc-texto-apagado`, `--sc-texto-tenue`
<!-- fin -->

<!-- entrada: librerias -->
- Librerías: `jose@6.2.18`, `next@16.4.6`, `pg@8.23.1`, `pino@10.4.0`, `prom-client@15.1.3`, `react@19.3.0`, `react-dom@19.3.0`, `recharts@3.11.0`, `server-only@0.0.1`, `zod@4.6.7`
<!-- fin -->

<!-- entrada: desarrollo -->
- Desarrollo: `@playwright/test@1.65.1`, `@tailwindcss/turbopack@4.3.3`, `@types/node@24.19.2`, `@types/pg@8.23.1`, `@types/react@19.3.0`, `@types/react-dom@19.3.0`, `eslint@9.39.5`, `eslint-config-next@16.4.6`, `tailwindcss@4.3.3`, `typescript@5.9.3`, `vitest@5.1.1`
<!-- fin -->

<!-- entrada: scripts -->
- Scripts: `npm run dev → next dev`, `npm run build → next build`, `npm run start → next start`, `npm run lint → eslint .`, `npm run typecheck → next typegen && tsc --noEmit`, `npm run test:unit → vitest run --project unit`, `npm run test:integration → vitest run --project integration`, `npm run seed → node scripts/seed.mjs`, `npm run e2e → playwright test`
<!-- fin -->

<!-- entrada: vitest -->
- Pruebas unitarias e integración (Vitest, proyectos): `unit: "src/**/__tests__/**/*.test.ts"`, `integration: "src/**/__tests__/**/*.int.test.ts"`. Una prueba de integración va en `*.int.test.ts`; `server-only` se simula con `src/test/vacio.ts`.
<!-- fin -->

<!-- entrada: playwright -->
- Pruebas e2e (Playwright): carpeta `e2e`, contra una app ya levantada en `BASE_URL` (por defecto `http://localhost:3000`).
<!-- fin -->

<!-- entrada: postgres -->
- Postgres: `postgres:17-alpine`, acceso con `pg` y SQL a mano solo en `repo.ts`. Tipos usados en las migraciones: `double precision`, `text`, `timestamptz`, `uuid`.
<!-- fin -->

<!-- entrada: flyway -->
- Flyway: `flyway/flyway:11`, lee `db/migration` (`docker compose run --rm flyway migrate info`). Modismos de las migraciones: `uuid PRIMARY KEY DEFAULT gen_random_uuid()` como clave; `timestamptz NOT NULL DEFAULT now()` para fechas; `REFERENCES … ON DELETE CASCADE` en claves foráneas; `CHECK (…)` para dominios y rangos; índices con nombre `<tabla>_<columna>_idx`.
<!-- fin -->
