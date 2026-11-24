# Decisiones

| # | Fecha | Fase | Decisión | Decidió | Votos | Evidencia | Alternativas descartadas | Revisar |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-24 | Propuesta | CA-2: el alias es obligatorio, se recortan los espacios y mide de 1 a 100 caracteres, sin restringir caracteres. Vacío, solo espacios, más de 100 caracteres o un `nodoId` que no es UUID → 400 (como `sensores`); un UUID sin nodo → 404. | Persona | — | preguntas.md #1 | Máximo 50 caracteres | no |
| 2 | 2026-11-24 | Propuesta | CA-1: como la HU 8 (#25) no está fusionada, esta historia crea lo mínimo que necesita: la tabla `nodo_usuarios` (id, nodo_id con borrado en cascada, alias, creado_en), el módulo `src/modulos/afectados/` y un panel en la ficha con la lista, el total y el formulario de alta. La HU 8 deberá reutilizarlos en lugar de crearlos. | Persona | — | preguntas.md #2 | Detener la corrida hasta fusionar la HU 8 | sí |
| 3 | 2026-11-24 | Propuesta | Endpoint `POST /api/afectados` con `{ nodoId, alias }` en el cuerpo; responde 201 con el afectado creado. El panel lee la lista con el servicio desde el Server Component del panel (sin `GET` nuevo en la API, que es de la HU 8). | Orquestador | — | Notas técnicas del issue | `POST /api/nodos/{id}/afectados`; agregar `GET /api/afectados` | sí |
| 4 | 2026-11-24 | Propuesta | Sin semilla nueva: N0 empieza sin afectados, como pide el e2e del issue. | Orquestador | — | Notas técnicas del issue | Semilla de demostración | no |
