# Producto

Qué hace la aplicación y el backlog de historias (`docs/propuesta.md` §1 y §5): lo que cada una entrega y de cuál depende. Una historia que depende de otra no fusionada no puede suponer su tabla ni su módulo: es una pregunta.

<!-- entrada: resumen -->
La aplicación permite administrar nodos y sensores de una red eléctrica, simular lecturas de voltaje, corriente y potencia, visualizarlas en un dashboard, generar alertas por umbral y, en las historias de clase, aislar nodos, notificar a técnicos y consultar el histórico.
<!-- fin -->

<!-- entrada: historia 1 -->
- **#1** Proyecto y entorno SDD, en dos issues con su change de OpenSpec cada uno (issues de GitHub) — fase: Línea base; depende de: –; entrega: Repositorio listo para que cualquier historia siga el flujo SDD
<!-- fin -->

<!-- entrada: historia 2 -->
- **#2** Infraestructura y CI/CD — fase: Línea base; depende de: 1; entrega: Imagen del esqueleto publicada en `ghcr.io` y pipeline en verde
<!-- fin -->

<!-- entrada: historia 3 -->
- **#3** Login con roles (admin y técnico) — fase: Línea base; depende de: 2; entrega: `auth`
<!-- fin -->

<!-- entrada: historia 4 -->
- **#4** CRUD de nodos y sensores, con simulador de lecturas (voltaje, corriente, potencia) — fase: Línea base; depende de: 3; entrega: `nodos`, `sensores`, `lecturas`, `POST /api/simulador`
<!-- fin -->

<!-- entrada: historia 5 -->
- **#5** Dashboard con última lectura, gráfica por sensor y alertas por umbral — fase: Línea base; depende de: 4; entrega: Panel del frontend, `alertas`
<!-- fin -->

<!-- entrada: historia 6 -->
- **#6** Aislar nodo — fase: Clase; depende de: Línea base; entrega: `nodos` (columna `estado` ya creada en la base)
<!-- fin -->

<!-- entrada: historia 7 -->
- **#7** Centro de notificaciones del técnico — fase: Clase; depende de: Línea base (historia 3); entrega: Módulo `notificaciones` con tabla propia, lee `usuarios`
<!-- fin -->

<!-- entrada: historia 8 -->
- **#8** Usuarios o dispositivos afectados por un nodo — fase: Clase; depende de: Línea base; entrega: Tabla propia `nodo_usuarios`
<!-- fin -->

<!-- entrada: historia 9 -->
- **#9** Histórico con filtros y exportación a CSV — fase: Clase; depende de: Línea base; entrega: Lee solo `lecturas`
<!-- fin -->

<!-- entrada: historia 10 -->
- **#10** Asignación de un técnico a un nodo — fase: Clase; depende de: Línea base; entrega: Módulo `mantenimiento` con tabla propia de asignaciones, lee `nodos` y `usuarios`
<!-- fin -->

<!-- entrada: historia 11 -->
- **#11** Registro de los mantenimientos de un nodo por el técnico asignado — fase: Clase; depende de: Línea base e historia 10; entrega: Tabla propia de registros en el módulo `mantenimiento`, lee la asignación de la historia 10
<!-- fin -->

<!-- entrada: historia 12 -->
- **#12** Crear una notificación por técnico cuando salta una alerta de umbral — fase: Clase; depende de: Línea base (historia 5) e historia 7; entrega: Suscriptor `on-alerta.ts` en el módulo `notificaciones`, escribe en la tabla de la historia 7
<!-- fin -->
