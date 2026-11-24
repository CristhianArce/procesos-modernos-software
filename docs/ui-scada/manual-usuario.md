# Manual de usuario: sala de control de la red eléctrica

Este manual explica cómo usar el tablero con cada uno de sus dos perfiles. Las cuentas de demostración son:

| Usuario | Perfil | Contraseña |
|---|---|---|
| `admin` | Administrador | `Demo-Admin-2026` |
| `tecnico` | Técnico | `Demo-Tecnico-2026` |

## 1. Conceptos básicos (comunes a ambos perfiles)

- **Nodo:** un punto de la red (central, subestación, alimentador, carga). Tiene nombre y ubicación.
- **Sensor:** un medidor instalado en un nodo. Mide **voltaje (V)**, **corriente (A)** y **potencia (W)**.
- **Lectura:** una medición de un sensor en un instante.
- **Umbral:** el máximo permitido de cada magnitud en un sensor. Es opcional: sin umbral no hay alerta.
- **Alerta:** se crea cuando una lectura supera un umbral.
- **Mímico:** el diagrama de la red con sus nodos y las líneas que los unen.

### Estados y colores

Cada estado se distingue por color, forma y texto, para que no dependa solo del color.

| Estado | Cuándo ocurre |
|---|---|
| Normal | Todos los valores están por debajo del 98 % de su umbral, o no hay umbral. |
| Advertencia | Algún valor está entre el 98 % y el 100 % de su umbral. |
| Crítico | Algún valor supera su umbral. |
| Desconectado | El nodo está marcado como desconectado. |
| Sin datos | Aún no hay lecturas. |

El estado de un nodo es el peor de los estados de sus sensores.

### Inicio de sesión y cierre

1. Abre la dirección de la app. Si no tienes sesión, te lleva a `/login`.
2. Escribe usuario y contraseña, y pulsa el botón de ingresar.
3. La sesión dura **8 horas**. Para cerrarla usa el botón de salir de la barra superior.

### La pantalla

- **Barra superior:** nombre de la red, reloj (hora de Bogotá), estado de la conexión («En línea»), conteo de alertas activas (con enlace al panel de alarmas) y tu perfil.
- **Menú lateral:** Inicio, Dashboard y Nodos.
- **Avisos emergentes:** cuando aparece una alerta nueva sale un aviso con el nodo, el sensor, el valor, el umbral y el porcentaje de exceso. Se ve un máximo de tres a la vez. Se cierran con su botón.

Los datos se actualizan solos cada pocos segundos. Si pasas a otra pestaña del navegador, la actualización se pausa y se reanuda al volver.

## 2. Perfil Técnico (solo lectura)

El técnico **observa y diagnostica**; no modifica nada.

### 2.1 Dashboard (`/dashboard`)

1. **Franja de indicadores:** potencia total, tensión media, nodos conectados y desconectados, alertas activas. Cada uno lleva una pequeña gráfica de tendencia.
2. **Mímico de la red:**
   - Cada nodo es un símbolo según su tipo y su color según su estado.
   - Las líneas animadas muestran el flujo de energía: a más potencia, más gruesas y más rápidas. Una línea con un extremo desconectado queda quieta y apagada.
   - **Acercar y alejar:** rueda del ratón o botones «Acercar» y «Alejar». «Encuadrar toda la red» vuelve a la vista inicial.
   - **Desplazar:** arrastra el fondo.
   - **Pasar el ratón** sobre un nodo muestra un resumen.
3. **Panel lateral del nodo:** haz clic en un nodo, o enfócalo con la tecla Tab y pulsa Enter o espacio. Se abre un panel con sus valores, sus gráficas y sus alertas. Se cierra con la tecla **Esc** o con el botón «Cerrar panel».
4. **Panel de alarmas:** lista las alertas recientes. El enlace de la barra superior lleva directo a él.

Si tu sistema operativo tiene activada la opción «reducir movimiento», se detienen la animación del flujo y el parpadeo de los estados críticos. La información sigue visible.

### 2.2 Nodos (`/nodos`)

- Tabla con nombre, ubicación, conexión, nivel, voltaje, potencia y alertas activas.
- Caja de búsqueda por nombre o ubicación.
- Pulsa el nombre de un nodo para abrir su **ficha**.

### 2.3 Ficha del nodo (`/nodos/<id>`)

- Datos del nodo y su estado.
- **Panel Sensores:** cada sensor con sus umbrales (voltaje, corriente, potencia) y su última lectura.
- **Panel Simulador:** al técnico le muestra el aviso «Solo un administrador puede simular lecturas».

### 2.4 Lo que el técnico no puede hacer

No ve «Editar topología», «Crear nodo» ni «Agregar sensor». Si intenta esas acciones llamando a la API, recibe **403**. Esto lo verifica el servidor; ocultar los botones es solo una comodidad visual.

## 3. Perfil Administrador

El administrador tiene **todo lo del técnico** y además configura la red.

### 3.1 Crear un nodo

1. Ve a **Nodos**.
2. En el formulario «Crear nodo» escribe el nombre y la ubicación.
3. Pulsa **Crear nodo**. Aparece en la tabla.

Un nodo nuevo todavía no tiene posición en el mímico: aparece debajo de la red, marcado como «sin ubicar», con tipo carga. Ubícalo con el editor (sección 3.3).

### 3.2 Agregar sensores y umbrales

1. Entra a la ficha del nodo.
2. En el panel **Sensores**, bajo «Nuevo sensor», escribe el nombre y, si quieres, los umbrales de voltaje, corriente y potencia.
3. Pulsa **Agregar sensor**.

Un umbral vacío significa «sin límite» para esa magnitud.

### 3.3 Editar la topología (mímico)

En el Dashboard pulsa **Editar topología**. Entras en «modo edición».

| Acción | Cómo se hace |
|---|---|
| Mover un nodo | Arrástralo, o enfócalo y usa las flechas del teclado. Cada paso es de 10 unidades; con Mayús, de 50. Los nodos se ajustan a una retícula de 10. |
| Cambiar el tipo de un nodo | Selecciónalo y elige el tipo en el selector «Tipo de …». |
| Crear un enlace | Elige un nodo y luego otro. El enlace va **del primero al segundo**. Elegir dos veces el mismo nodo cancela la elección. |
| Borrar un enlace | Elige el enlace y pulsa «Borrar enlace …». |
| Guardar posiciones | Pulsa **Guardar posiciones (n)**. Solo se guardan las que cambiaron de verdad. |
| Descartar | Pulsa **Descartar cambios**: vuelve todo a lo guardado. |
| Terminar | Pulsa **Salir de edición**. |

Los movimientos de nodos quedan **pendientes** hasta que pulses Guardar. Los enlaces se crean y se borran de inmediato. Todo queda guardado en la base de datos, así que sobrevive a recargar la página y se ve igual para el técnico.

### 3.4 Simular lecturas

En la ficha del nodo, panel **Simulador**, pulsa **Simular lecturas**. Se registra una lectura nueva por cada sensor del nodo. Si alguna supera un umbral, se crea una alerta y aparece el aviso emergente.

Si el servidor se arrancó con el simulador continuo (variable `SIM_AUTO_MS`), las lecturas cambian solas y no hace falta pulsar nada.

### 3.5 Otras acciones solo por API

Editar y eliminar nodos o sensores existe en la API (`PATCH` y `DELETE` en `/api/nodos/<id>` y `/api/sensores/<id>`), pero la interfaz todavía no tiene botones para eso.

## 4. Resumen de permisos

| Acción | Técnico | Administrador |
|---|:-:|:-:|
| Ver dashboard, mímico, alarmas y ficha del nodo | Sí | Sí |
| Abrir y cerrar el panel lateral del nodo | Sí | Sí |
| Crear nodo | No | Sí |
| Agregar, editar o borrar sensores y umbrales | No | Sí |
| Editar topología (mover, enlazar, borrar enlace) | No | Sí |
| Simular lecturas | No | Sí |

## 5. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| Me devuelve a `/login` | La sesión venció (8 horas) o no hay cookie. Vuelve a ingresar. |
| Los valores no cambian | Si la app corre en Docker, el simulador continuo está apagado. Pulsa «Simular lecturas» o usa el modo desarrollo con `SIM_AUTO_MS`. |
| No veo «Editar topología» | Estás con el perfil técnico. |
| La barra dice que no hay conexión | El navegador no alcanza al servidor. El indicador se recupera solo cuando vuelve. |
