## Historia

Como administrador quiero registrar qué usuarios o dispositivos dependen de un nodo para saber a quién afecta una falla o un corte antes de actuar.

## Contexto

Es la HU 8 de la propuesta (sección 5), historia de clase. La ficha del nodo (HU 4) muestra sus datos y sus sensores, pero no dice quién depende de él. Esta historia agrega un panel a esa ficha, mediante `paneles.ts`, y una tabla propia para guardar los afectados por nodo.

## Criterios de aceptación

- **CA-1:** Dado un nodo y un administrador, cuando agrega un afectado con datos válidos desde el panel de la ficha, entonces el afectado aparece en la lista del panel.
- **CA-2:** Dado un afectado registrado en un nodo, cuando el administrador lo quita, entonces desaparece de la lista y los afectados de otros nodos no cambian.
- **CA-3:** Dado un nodo con afectados, cuando se abre su ficha, entonces el panel muestra el total de afectados y su lista.
- **CA-4:** Dado un usuario técnico, cuando abre la ficha del nodo, entonces ve la lista pero no los botones de agregar o quitar, y si llama a la API de agregar o quitar recibe 403.
- **CA-5:** Dados datos inválidos al agregar un afectado, cuando se llama a la API, entonces responde 400 por la validación de Zod y no guarda nada.
- **CA-6:** Dado un identificador de nodo que no existe, cuando se consulta, agrega o quita un afectado, entonces la API responde 404.

## Reglas de negocio

- **RN-1:** Cada afectado pertenece a un solo nodo; quitarlo de un nodo no lo borra de otros.
- **RN-2:** El panel se enchufa por `paneles.ts`: no se edita la página de la ficha de la HU 4.

## Fuera de alcance

- Notificar a los afectados.
- Calcular automáticamente los afectados a partir de la topología de la red.
- Importar afectados desde un archivo.

## Notas técnicas (no vinculantes)

- Módulo: `src/modulos/afectados/` · panel en la ficha del nodo vía `paneles.ts`.
- Endpoints sugeridos: `GET|POST /api/afectados` con el nodo como parámetro y `DELETE /api/afectados/{id}` (se agregan a `contracts/openapi.yaml`), `requireRole("admin")` en las escrituras.
- Datos: tabla propia `nodo_usuarios` con migración Flyway; semilla `db/seed/afectados.sql`. Lee `nodos` sin modificarla.
- Puntos de extensión: `paneles.ts`.

## Dependencias

- HU 4 (#21: CRUD de nodos y sensores, con simulador).

## Preguntas abiertas

- ¿Qué es un "afectado"? — opciones: una persona o equipo sin cuenta en el sistema, con nombre y tipo (usuario o dispositivo) / un usuario del sistema ya existente en la tabla `usuarios`. Los CA asumen la primera; si es la segunda, cambia el CA-1 y los datos de la tabla.
- ¿Se evita repetir el mismo afectado en un nodo? — opciones: sí, con 409 si ya existe / no.
- ¿Qué datos lleva un afectado? — opciones: nombre y tipo / además un contacto.

## Definición de hecho

- [ ] Cada `CA-n` cubierto por al menos una prueba (unitaria, de integración o smoke).
- [ ] Change de OpenSpec con proposal, specs, design (si cambia contrato o esquema) y tasks, validado con `openspec validate --strict`.
- [ ] Build, lint, typecheck y pruebas en verde en el CI.
- [ ] `evidencias/issue-<n>/` en el PR, con la trazabilidad CA → requisito → tarea → código → prueba.
- [ ] Change archivado después del merge.
