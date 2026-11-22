# Preguntas

Estados: `abierta` (sin responder), `respondida` (Respuesta: `<respuesta> (decisión #k)`) y `diferida` (Respuesta: `supuesto: <opción> (decisión #k)`, con `Revisar: sí` en la decisión).

| # | Tipo | Pregunta | Estado | Respuesta |
|---|---|---|---|---|
| 1 | Negocio | ¿Qué campos tiene un nodo y un sensor? Opciones: nodo con nombre, ubicación y estado; sensor con nombre, tipo y umbrales / otros campos. | respondida | Nodo: nombre, ubicación y estado; sensor: nombre y umbrales, sin tipo (decisión #1) |
| 2 | Negocio | ¿Cada sensor mide una sola magnitud o cada lectura trae las tres? Opciones: un sensor por magnitud / una lectura con voltaje, corriente y potencia (CA-6 asume esta). | respondida | Una lectura con voltaje, corriente y potencia (decisión #2) |
| 3 | Negocio | ¿Dónde se definen los umbrales de la HU 5? Opciones: dos columnas por sensor (mínimo y máximo) / un umbral por magnitud. | respondida | Un umbral máximo por magnitud en el sensor, tres columnas opcionales (decisión #3) |
| 4 | Negocio | ¿Qué rango de valores genera el simulador? Opciones: aleatorios en rango razonable por magnitud, con alguna lectura fuera de umbral / valores fijos configurables. | respondida | Aleatorios en rango razonable por magnitud, con alguna lectura fuera de umbral (decisión #4) |
| 5 | Negocio | ¿Se elimina un nodo con sensores o lecturas? Opciones: cascada / rechazo con 409. | respondida | Cascada (decisión #5) |
| 6 | Negocio | ¿El técnico solo consulta? Opciones: solo lectura / puede editar nodos pero no eliminarlos (CA-5 asume solo lectura). | respondida | Solo lectura (decisión #6) |
| 7 | Negocio | ¿El simulador es también un temporizador? Opciones: solo botón y API / temporizador desactivado por defecto. | respondida | Solo botón y API (decisión #7) |
| 8 | Negocio | CA-3: qué hace inválido un dato (longitud máxima del nombre, ubicación obligatoria u opcional, unicidad del nombre) — opciones: solo nombre obligatorio y longitud máxima / además nombre único (409 al duplicar). | respondida | Nombre obligatorio con longitud máxima, ubicación opcional, sin unicidad (decisión #8) |
| 9 | Negocio | CA-6: qué responde el simulador si el nodo no tiene sensores — opciones: 200 con cero lecturas / 409 o 422 con mensaje. | respondida | 200 con cero lecturas (decisión #9) |
| 10 | Negocio | CA-6: ¿el simulador actúa sobre un nodo (por id) o sobre todos los nodos cuando se llama a la API sin id? — opciones: nodo indicado en el cuerpo / todos los nodos si no se indica. | respondida | Nodo indicado en el cuerpo, obligatorio (decisión #10) |
