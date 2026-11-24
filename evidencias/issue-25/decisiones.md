# Decisiones

| # | Fecha | Fase | Decisión | Decidió | Votos | Evidencia | Alternativas descartadas | Revisar |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-24 | Propuesta | CA-1: la lista de afectados se ordena por orden de creación, el más antiguo primero (desempate por id) | Persona | — | preguntas.md #1 | Alfabético por alias | no |
| 2 | 2026-11-24 | Propuesta | Alias: texto obligatorio, recortado, de 1 a 100 caracteres (columna `alias text NOT NULL` con CHECK); la HU 14 lo validará al crear | Orquestador | — | RN-3 | Sin límite de longitud | sí |
| 3 | 2026-11-24 | Propuesta | Endpoint `GET /api/afectados?nodoId=<uuid>`, respuesta `{ total, afectados: [{ id, alias, creadoEn }] }`; un `nodoId` ausente o que no es UUID responde 400, y un UUID sin nodo responde 404 | Orquestador | — | Notas técnicas del issue | `/api/afectados/{nodoId}` | sí |
| 4 | 2026-11-24 | Propuesta | Semilla de afectados: agrega `Usuario demo 02` (id fijo) a N1 = `Subestación Sur` (`...0002` de `db/seed/nodos.sql`) con `ON CONFLICT (id) DO NOTHING`; N0 = `Subestación Norte` (`...0001`) queda sin afectados | Orquestador | — | Notas técnicas del issue | Varios afectados por nodo | sí |
| 5 | 2026-11-24 | Propuesta | La semilla se llama `db/seed/nodos_afectados.sql` y no `afectados.sql`: `scripts/seed.mjs` aplica las semillas en orden alfabético y `afectados.sql` correría antes que `nodos.sql`, rompiendo la llave foránea en una BD nueva | Orquestador | — | scripts/seed.mjs | `afectados.sql` con `WHERE EXISTS` (no siembra en una BD nueva); repetir el nodo en la semilla (escribe en una tabla ajena) | sí |
| 6 | 2026-11-24 | Implementar | Tarea 7.2 pendiente al cerrar el paso 5: es el `build-test` y el `openspec validate` que corren en el paso 6; se marca allí | Orquestador | — | tasks.md 7.2 | Correr build-test dos veces | no |
