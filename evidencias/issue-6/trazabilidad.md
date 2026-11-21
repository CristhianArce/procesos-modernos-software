# Trazabilidad

Generado por `trazabilidad-grep.mjs --pruebas` (CA → requisito/escenario → tarea → prueba). Caso: pruebas cuyo nombre cita `#<n> CA-k`. Código: pendiente de la trazabilidad final (pospuesta).

| Criterio | Tarea | Requisito | Escenario | Código | Caso | Estado |
|---|---|---|---|---|---|---|
| CA-1 | 2.1; 3.1; 6.1 | acerca-de: Consulta de la información de la app por API | acerca-de: Un administrador consulta la información (CA-1); acerca-de: Un técnico consulta la información (CA-1) | — | src/modulos/acerca/__tests__/handler.test.ts: #6 CA-1: responde 200 con nombre y version a un administrador; src/modulos/acerca/__tests__/handler.test.ts: #6 CA-1: responde 200 con nombre y version a un técnico; src/modulos/acerca/__tests__/service.test.ts: #6 CA-1: devuelve nombre y version no vacíos | Cubierto en spec, tareas y pruebas |
| CA-2 | 4.1; 5.1; 6.1 | acerca-de: Ítem "Acerca de" en el menú; acerca-de: Página "Acerca de" | acerca-de: El técnico ve el ítem en el menú (CA-2); acerca-de: El técnico entra a la página (CA-2) | — | src/modulos/acerca/__tests__/menu.test.ts: #6 CA-2: el técnico ve el ítem Acerca de que lleva a /acerca; src/modulos/acerca/__tests__/pagina.test.tsx: #6 CA-2: la página muestra el nombre y la versión | Cubierto en spec, tareas y pruebas |
| CA-3 | 3.2; 3.3; 6.1 | acerca-de: Rechazo de visitantes sin sesión | acerca-de: Un visitante sin sesión consulta la información (CA-3) | — | src/modulos/acerca/__tests__/handler.test.ts: #6 CA-3: responde 401 con JSON de error sin sesión; src/modulos/acerca/__tests__/route.test.ts: #6 CA-3: la ruta sin sesión responde 401 | Cubierto en spec, tareas y pruebas |

## Huérfanos

- (ninguno)

Pruebas: 3 de 3 CA con prueba

Veredicto: completa
