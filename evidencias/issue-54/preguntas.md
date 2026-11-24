# Preguntas

Estados: `abierta` (sin responder), `respondida` (Respuesta: `<respuesta> (decisión #k)`) y `diferida` (Respuesta: `supuesto: <opción> (decisión #k)`, con `Revisar: sí` en la decisión).

| # | Tipo | Pregunta | Estado | Respuesta |
|---|---|---|---|---|
| 1 | Negocio | CA-2: qué hace inválido un alias (longitud máxima, alias vacío o solo espacios, caracteres permitidos) — opciones: obligatorio con recorte de espacios y máximo 50 caracteres / obligatorio con recorte de espacios y máximo 100 caracteres | respondida | Obligatorio, con recorte de espacios, de 1 a 100 caracteres, sin restringir caracteres (decisión #1) |
| 2 | Negocio | CA-1: la HU 8 (#25) sigue abierta y no existen la tabla `nodo_usuarios`, el módulo `afectados` ni su panel. ¿Se detiene la corrida o esta historia crea lo mínimo? | respondida | Crear lo mínimo aquí: tabla `nodo_usuarios`, módulo `afectados` y panel con lista, total y alta (decisión #2) |
