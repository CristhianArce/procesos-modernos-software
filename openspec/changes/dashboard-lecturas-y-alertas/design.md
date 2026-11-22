## Context

La HU 4 (#21) dejó las tablas `nodos`, `sensores` (con `umbral_voltaje`, `umbral_corriente` y `umbral_potencia`, máximos y opcionales) y `lecturas` (`voltaje`, `corriente`, `potencia`, `tomada_en`), los módulos `lecturas`, `sensores` y `simulador`, y el registro de extensiones `src/nav/registro.ts`, que ya descubre los `on-alerta.ts` de los módulos y los expone en `registro.suscriptores` (cada uno con `modulo` y `manejar(alerta)`). Hoy el único que registra lecturas es `simulador/service.ts` (`simular`), que ya tiene los sensores del nodo con sus umbrales.

## Goals / Non-Goals

**Goals:**
- Tabla `alertas` y servicio que crea una alerta por magnitud fuera de umbral y avisa a los suscriptores (CA-3, CA-5).
- `GET /api/lecturas` y `GET /api/alertas` con sesión y validación Zod (CA-6, CA-7).
- Página `/dashboard` con última lectura, gráficas y alertas (CA-1, CA-2, CA-4).

**Non-Goals:**
- Notificar a técnicos (HU 7), severidades, estado de las alertas, tiempo real e interacción en las gráficas.
- Semilla de alertas (decisión #6) y contador `alertas_umbral_total` (decisión #10).

## Decisions

### Esquema
`db/migration/V202611222300__alertas.sql`:

```sql
CREATE TABLE alertas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id uuid NOT NULL REFERENCES sensores (id) ON DELETE CASCADE,
    magnitud text NOT NULL CHECK (magnitud IN ('voltaje', 'corriente', 'potencia')),
    valor double precision NOT NULL,
    umbral double precision NOT NULL,
    creada_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alertas_creada_idx ON alertas (creada_en DESC);
CREATE INDEX alertas_sensor_creada_idx ON alertas (sensor_id, creada_en DESC);
```

Solo agrega una tabla; la clave foránea apunta a `sensores` sin modificarla. Sin columna de severidad ni de estado (RN-3, RN-4). La fecha es la de registro (decisión #9).

### Dónde se evalúan las alertas
`simular` registra las lecturas y, en la línea siguiente, llama a `registrarAlertas(lecturas, sensores)` de `src/modulos/alertas/service.ts` (decisión #5). Evaluar en `lecturas/service.ts` obligaría a leer los umbrales desde ahí y crearía el ciclo lecturas → alertas → sensores → lecturas.

### Servicio de alertas
- `excesos(lectura, umbrales)`: función pura que devuelve una `AlertaNueva` (`sensorId`, `magnitud`, `valor`, `umbral`) por cada magnitud con umbral no nulo y `valor > umbral` (CA-3, RN-1).
- `registrarAlertas(lecturas, sensores)`: junta los excesos de todas las lecturas, los guarda con `repo.insertar` en una sola sentencia y luego avisa: por cada alerta y cada suscriptor de `registro.suscriptores`, `await s.manejar(alerta)` dentro de `try/catch`; el error va a `logger.error({ modulo, alertaId, err }, ...)` y el bucle sigue (CA-5, RN-6). Sin excesos no llama al repo.
- `listarAlertas({ sensorId, limite })`: delega en `repo.recientes`.

### Consultas de lecturas
- `lecturas/repo.recientes({ sensorId, limite })`: `WHERE ($1::uuid IS NULL OR sensor_id = $1) ORDER BY tomada_en DESC, id DESC LIMIT $2` (API, decisión #8).
- `lecturas/repo.recientesPorSensor(sensorIds, limite)`: `row_number() OVER (PARTITION BY sensor_id ORDER BY tomada_en DESC, id DESC) <= $2`, devuelto en orden ascendente de fecha; el servicio lo indexa por sensor en un `Map` (CA-2, decisión #12).
- `sensores/repo.listarTodos()` y `sensores/service.listarTodosLosSensores()`: todos los sensores, por fecha de creación (decisión #12).

### Validación de la consulta
`src/modulos/lecturas/schema.ts` exporta `consultaRecientesSchema(limitePorDefecto)`:
`z.object({ sensorId: z.guid().optional(), limite: z.coerce.number().int().min(1).max(100).default(limitePorDefecto) })`. Lecturas lo usa con 50 y `src/modulos/alertas/schema.ts` con 20 (decisiones #1, #2, #8). El handler lo aplica a `Object.fromEntries(searchParams)`; el `ZodError` lo traduce `conHttp` a 400.

### Handlers
`src/app/api/lecturas/route.ts` y `src/app/api/alertas/route.ts`: `conHttp`, `requireRole(await sessionFromRequest(req), ...ROLES)`, parseo y `Response.json(...)`. `dynamic = "force-dynamic"`.

### Contrato
`contracts/openapi.yaml` agrega el esquema `Alerta` (`id`, `sensorId`, `magnitud` enum, `valor`, `umbral`, `creadaEn`), el parámetro `sensorId` y `limite`, y las rutas `GET /api/lecturas` y `GET /api/alertas` con respuestas 200, 400 y 401.

### Página y UI
- `src/app/(tablero)/dashboard/page.tsx` (Server Component dinámico): lee `listarTodosLosSensores()`, `lecturasRecientesPorSensor(ids, 50)` y `listarAlertas({ limite: 20 })` de los servicios; nunca hace `fetch` a la API.
- `src/modulos/dashboard/formato.ts`: `formatearFecha(iso)` con `Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Bogota" })` y `UNIDAD = { voltaje: "V", corriente: "A", potencia: "W" }` (decisiones #3, #7).
- `src/modulos/dashboard/ui/TarjetaSensor.tsx` (síncrono, sin datos propios): nombre, última lectura (`data-testid="ultima-lectura"`) o "Sin lecturas", y la gráfica si hay lecturas.
- `src/modulos/dashboard/ui/GraficaSensor.tsx` (`"use client"`): tres `LineChart` de Recharts de tamaño fijo, cada uno con su `YAxis` y un título "Voltaje (V)", "Corriente (A)" y "Potencia (W)"; sin tooltip ni selector (RN-5).
- `src/modulos/dashboard/ui/ListaAlertas.tsx` (síncrono): tabla con fecha, sensor, magnitud, valor y umbral con unidad, o "Sin alertas".
- `src/modulos/dashboard/menu.ts`: `{ etiqueta: "Dashboard", href: "/dashboard", roles: ["administrador", "tecnico"], orden: 5 }` (decisión #4).

## Risks / Trade-offs

- [Otra ruta que registre lecturas en el futuro no crearía alertas] → Mitigación: esa historia llama a `registrarAlertas`, igual que el simulador; queda en la decisión #5.
- [Un suscriptor lento retrasa la respuesta del simulador] → Se acepta: hoy no hay suscriptores y la HU 7 decide si su aviso es asíncrono.
- [El dashboard lee todas las lecturas recientes de todos los sensores en cada carga] → Una sola consulta acotada a 50 por sensor sobre el índice `(sensor_id, tomada_en DESC)`; suficiente para la red de demostración.

## Migration Plan

Flyway aplica `V202611222300__alertas.sql` en el despliegue; es aditiva y compatible hacia atrás. Revertir es desplegar la versión anterior: la tabla queda sin uso.

## Open Questions

Ninguna: las dudas de negocio quedaron en las decisiones #1 a #3 y los supuestos en #4 a #12.
