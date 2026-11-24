| # | Tipo | Pregunta | Estado | Respuesta |
|---|---|---|---|---|
| 1 | Negocio | CA-2: ¿los extremos del rango de fechas son inclusivos o exclusivos, y la fecha sin hora cubre el día completo? — opciones: inclusivo en ambos extremos / inicio inclusivo y fin exclusivo | respondida | Por día, inclusivo en ambos extremos: «desde» cubre desde las 00:00 y «hasta» el día completo (decisión #1) |
| 2 | Negocio | CA-4: ¿un rango con fecha inicial igual a la final es válido o es 400? — opciones: válido / 400 | respondida | Válido: consulta ese único día; 400 solo si la inicial es posterior a la final (decisión #2) |
| 3 | Negocio | CA-1: ¿qué formato de fecha (zona horaria) se muestra en la tabla y se acepta en el filtro? — opciones: UTC ISO 8601 / hora local del navegador | respondida | Hora de Bogotá, como el resto del tablero; la API devuelve ISO 8601 (decisión #3) |
