## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
Motivo (si BLOQUEAR):

Comprobaciones:
- `openspec validate ver-afectados-de-un-nodo --strict --type change --no-interactive` termina con `Change 'ver-afectados-de-un-nodo' is valid`.
- El formato de la spec es correcto: `## Purpose` con texto real, encabezados y palabras clave en inglés.
- La salida de `trazabilidad-grep.mjs` no deja nada pendiente.
- Todo lo existente que usa el change aparece en `contexto.md`: `nodos`, `obtenerNodo`, `paneles.ts` y los patrones de `sensores`. La tabla `nodo_usuarios` y el módulo `afectados` los crea el propio change.
- No hay capacidad previa que modificar.
- `preguntas.md` tiene la pregunta #1 `respondida`, con la decisión #1, que existe. Las decisiones #1 a #7 citadas tienen fila en `decisiones.md`.
- Cada tarea tiene su verificación. El PR, el CI, la e2e contra la app levantada y el archivado van como viñetas en `## Workflow follow-up`.
- El contrato va en el grupo del handler (5.2).
- Cada grupo lleva sus pruebas. El grupo final solo hace integración y aceptación.
- La migración V202611241700 es posterior a la última existente (V202611222330) y solo crea una tabla, así que es hacia adelante y compatible hacia atrás.
- El orden de la semilla es correcto: `scripts/seed.mjs` usa `.sort()`, y `nodos.sql` ordena antes que `nodos_usuarios.sql`.
- `design.md` cumple la regla de interfaz: reutiliza `Cargando`, `EstadoError` y `EstadoVacio`, usa `.cifra` y tokens, y el panel es de solo lectura.
