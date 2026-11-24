<resumen de la historia>

Closes #<n>

## Criterios de aceptación

| CA | Estado | Tarea | Prueba (`#<n> CA-k`) |
|---|---|---|---|

## Decisiones a revisar

Ninguna. <!-- o: | # | Decisión | Por qué se tomó sin la persona | (filas de decisiones.md con Revisar: sí) -->

## Tareas pendientes

Ninguna. <!-- o: | Tarea | Motivo (decisiones.md) | -->

## Migraciones

Ninguna.

## Cómo probar

```bash
npm run test:unit
npm run test:integration   # lo corre el CI del PR
npm run e2e   # lo corre el CI del PR; solo si la historia agrega pruebas en e2e/
```

## Después del merge

Correr `/archivar-change-openspec <n>` desde `main` para pasar los specs del change a `openspec/specs/` (el orquestador no archiva; sin este paso los specs quedan desactualizados).

Change: <change>
