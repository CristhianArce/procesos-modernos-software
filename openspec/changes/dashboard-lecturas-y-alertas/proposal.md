## Why

Con la HU 4 (#21) ya hay nodos, sensores y lecturas simuladas, pero las lecturas no se ven juntas en ninguna parte ni se comparan con los umbrales de cada sensor. Esta historia (#22, HU 5) crea el dashboard con la última lectura y la gráfica de cada sensor, registra una alerta cada vez que una lectura supera un umbral y deja funcionando el punto de enganche `on-alerta.ts` que usará la HU 7.

## What Changes

- Tabla `alertas` con su migración Flyway: sensor, magnitud, valor, umbral y fecha de registro. Cubre CA-3 (Derivado: decisión #9). Sin semilla de alertas (Derivado: decisión #6).
- Módulo nuevo `src/modulos/alertas/`: al registrar lecturas, compara cada magnitud con el umbral máximo de su sensor y guarda una alerta por cada magnitud que lo supera; después avisa a cada suscriptor de `registro.suscriptores` y, si uno falla, registra el error y sigue. Cubre CA-3 y CA-5.
- El simulador llama al servicio de alertas justo después de registrar sus lecturas. Cubre CA-3 (Derivado: decisión #5).
- Rutas `GET /api/lecturas` y `GET /api/alertas`, con sesión obligatoria (401 en JSON) y parámetros `sensorId` y `limite` validados con Zod (400). Cubre CA-6 y CA-7 (Derivado: decisión #2, #8).
- Módulo nuevo `src/modulos/dashboard/`: página `/dashboard` con una tarjeta por sensor (última lectura con V, A y W y la fecha en es-CO, y un panel de tres gráficas pequeñas con Recharts, una por magnitud y con su propio eje, sobre sus 50 lecturas más recientes) y la lista de las 20 alertas más recientes. Entrada "Dashboard" en el menú. Cubre CA-1, CA-2 y CA-4 (Derivado: decisión #1, #3, #4, #7, #11, #12).
- Las dos rutas nuevas se agregan a `contracts/openapi.yaml`, conservando las existentes.

Fuera de alcance (issue #22): notificar a los técnicos (HU 7), editar umbrales desde el dashboard, tiempo real por WebSocket, severidades, marcar alertas como atendidas y cualquier interacción en las gráficas. Tampoco se agrega el contador opcional `alertas_umbral_total` (Derivado: decisión #10).

## Capabilities

### New Capabilities

- `alertas-por-umbral`: registro de una alerta por cada magnitud de una lectura que supera el umbral de su sensor, aviso a los suscriptores y consulta por la API.
- `dashboard-de-lecturas`: dashboard con la última lectura y la gráfica de cada sensor y la lista de alertas, y consulta de lecturas por la API.

### Modified Capabilities

(ninguna: `extension-modulos` ya define el descubrimiento de `on-alerta.ts`; esta historia lo usa sin cambiarlo)

## Impact

- **Datos:** migración `V202611222300__alertas.sql` (tabla nueva `alertas`, sin tocar `nodos`, `sensores` ni `lecturas`).
- **Código nuevo:** `src/modulos/alertas/`, `src/modulos/dashboard/`, `src/modulos/lecturas/schema.ts`, `src/app/api/{lecturas,alertas}/route.ts`, `src/app/(tablero)/dashboard/page.tsx` y `e2e/dashboard.spec.ts`.
- **Código que cambia:** `src/modulos/lecturas/{repo,service}.ts` (consultas de lecturas recientes), `src/modulos/sensores/{repo,service}.ts` (listar todos los sensores) y `src/modulos/simulador/service.ts` (una llamada al servicio de alertas).
- **Contrato:** `contracts/openapi.yaml` (dos rutas nuevas y el esquema `Alerta`).
- **Puntos de extensión:** `menu.ts` de `dashboard`; el servicio de alertas es el primero que invoca `registro.suscriptores`.
- **Sin cambios** en el núcleo (`proxy.ts`, `src/lib/`, layout del tablero, `src/nav/`) ni dependencias nuevas (Recharts ya está instalado).
