## Revisión de la propuesta — intento 1
Veredicto: APROBADO
| # | Severidad | Artefacto | Hallazgo | Corrección esperada |
|---|---|---|---|---|
| 1 | WARNING | design.md, sección "Risks / Trade-offs" (tercer punto) | Dice que "la semilla usa fechas de 2020". Eso contradice la decisión 9 del mismo design ("Sin semilla") y tasks.md, que no crea ninguna semilla. | Quitar la mención a la semilla. Decir que el e2e acota por su propio sensor, sin hablar de fechas de 2020. (Corregido) |
| 2 | WARNING | tasks.md 4.2 | La verificación es vaga: "`openspec validate --all` no se corre aquí; se revisa leyendo que el YAML siga los componentes". | Verificar con `openspec validate` del change o nombrar la ruta y los componentes `DatosInvalidos` y `NoAutenticado`. (Corregido) |
| 3 | SUGGESTION | design.md, Decisión 7 | `listarNodos()` y `listarTodosLosSensores()` existen en `nodos/service.ts` y `sensores/service.ts`, pero `contexto.md` no los lista; hay otro `listarNodos` en `topologia/repo.ts`. | Indicar el módulo de origen. (Aplicado) |
