| # | Tipo | Pregunta | Estado | Respuesta |
|---|------|----------|--------|-----------|
| 1 | Negocio | CA-4: cuántas alertas lista el dashboard (sin tope no hay prueba de "la más reciente primero" acotada) — opciones: las últimas 20 / las últimas 50 / paginación con límite configurable por parámetro | respondida | Las últimas 20 (decisión #1) |
| 2 | Negocio | CA-7: qué parámetros de consulta existen y cuáles son inválidos en `GET /api/lecturas` y `GET /api/alertas` — opciones: `sensorId` (UUID) y `limite` (entero 1 a 100) / solo `sensorId` y `limite` sin máximo fijado | respondida | `sensorId` (UUID) y `limite` (entero 1 a 100) (decisión #2) |
| 3 | Negocio | CA-1: formato de la fecha y de las unidades mostradas — opciones: ISO 8601 en UTC con V, A, W / fecha local legible (es-CO) con V, A, W | respondida | Fecha local legible es-CO con V, A, W (decisión #3) |
