# Inventario del repositorio

Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto. Si la historia cambia una capacidad, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito.

<!-- entrada: capacidad acceso-tablero -->
- Capacidad `acceso-tablero`: Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de redirigir, para que cada historia solo declare qué rol exige. Requisitos: Páginas del tablero redirigen sin sesión; API protegida responde 401 y 403 en JSON.
<!-- fin -->

<!-- entrada: capacidad calidad-proyecto -->
- Capacidad `calidad-proyecto`: Garantiza que cualquier integrante o agente pueda instalar el proyecto desde un clon limpio y correr lint, typecheck, pruebas y build con el mismo resultado, sin que el trabajo en curso de otras historias lo afecte. Requisitos: Comandos de calidad en verde desde un clon limpio; Carpetas de trabajo de los agentes ignoradas.
<!-- fin -->

<!-- entrada: capacidad despliegue-publico -->
- Capacidad `despliegue-publico`: Mantiene una instancia pública de la app, en un servicio gratuito, que ejecuta siempre la última imagen publicada por el CD, sin guardar secretos en el repositorio y sin pasos manuales después de cada merge. Requisitos: Servicio público con la imagen publicada; Aviso a Render desde el CD; Secretos del servicio fuera del repositorio; Base de datos del servicio público; Migraciones y semillas en el CD.
<!-- fin -->

<!-- entrada: capacidad entorno-local -->
- Capacidad `entorno-local`: Permite que cualquier integrante levante la base de datos, aplique las migraciones y arranque la app en su portátil con `docker compose`, con un error claro si falta configuración y sin que varios entornos se pisen los puertos. Requisitos: Arranque local completo; Variables obligatorias; Puertos del host que no chocan.
<!-- fin -->

<!-- entrada: capacidad extension-modulos -->
- Capacidad `extension-modulos`: Deja que cada historia agregue su ítem de menú, su panel en la ficha del nodo y su suscriptor de alertas declarándolos en su propio módulo, sin editar el núcleo ni los archivos de otras historias. Requisitos: Descubrimiento de extensiones por módulo; Menú filtrado por rol.
<!-- fin -->

<!-- entrada: capacidad inicio-de-sesion -->
- Capacidad `inicio-de-sesion`: Permite que un administrador o un técnico inicie y cierre sesión con su nombre de usuario y su contraseña, y que el tablero y la API reconozcan esa sesión y su rol, para que cada historia solo decida qué rol exige. Requisitos: Inicio de sesión con credenciales válidas; Credenciales incorrectas sin pistas; Validación del cuerpo del login; Límite de intentos fallidos; Acceso con la sesión emitida por el login; Endpoints reservados a administradores; Cierre de sesión.
<!-- fin -->

<!-- entrada: capacidad integracion-continua -->
- Capacidad `integracion-continua`: Detecta de forma automática, en cada PR y con poco tiempo de espera, que una historia rompió la calidad del proyecto o la imagen, y revisa secretos y vulnerabilidades al fusionar en `main`. Requisitos: Validación de cada PR; La imagen se construye y arranca en cada PR; Controles de seguridad solo al fusionar en main.
<!-- fin -->

<!-- entrada: capacidad observabilidad -->
- Capacidad `observabilidad`: Permite saber si la app está viva, medir su tráfico HTTP en formato Prometheus sin exponer las métricas a cualquiera, y registrar cada petición de forma estructurada sin filtrar datos sensibles. Requisitos: Salud de la app sin autenticación; Métricas protegidas por token; Log estructurado de cada petición sin datos sensibles.
<!-- fin -->

<!-- entrada: capacidad plantillas-y-etiquetas -->
- Capacidad `plantillas-y-etiquetas`: Da al equipo y al orquestador el mismo formato al abrir historias y PR, pide revisores por defecto y deja creadas las etiquetas que el flujo aplica con `gh`, que falla si una etiqueta no existe. Requisitos: Plantillas de historia y de PR; Etiquetas del flujo; Revisores por defecto.
<!-- fin -->

<!-- entrada: capacidad publicacion-imagen -->
- Capacidad `publicacion-imagen`: Deja la imagen de la app publicada y actualizada en el registro de GitHub después de cada cambio de código en `main`, para que cualquiera la ejecute sin construirla. Requisitos: Publicación al fusionar en main; Imagen pública y ejecutable; Permisos mínimos del CD.
<!-- fin -->

<!-- entrada: change aislar-nodo-de-la-red -->
- Change en curso `openspec/changes/aislar-nodo-de-la-red/`.
<!-- fin -->

<!-- entrada: change configuracion-ia-sdd -->
- Change en curso `openspec/changes/configuracion-ia-sdd/`.
<!-- fin -->

<!-- entrada: change dashboard-lecturas-y-alertas -->
- Change en curso `openspec/changes/dashboard-lecturas-y-alertas/`.
<!-- fin -->

<!-- entrada: change nodos-sensores-y-simulador -->
- Change en curso `openspec/changes/nodos-sensores-y-simulador/`.
<!-- fin -->

<!-- entrada: tabla usuarios -->
- Tabla `usuarios`: id, nombre_usuario, contrasena_hash, rol, creado_en (V202611221930__usuarios.sql).
<!-- fin -->

<!-- entrada: tabla nodos -->
- Tabla `nodos`: id, nombre, ubicacion, estado, creado_en (V202611222130__nodos_sensores_lecturas.sql).
<!-- fin -->

<!-- entrada: tabla sensores -->
- Tabla `sensores`: id, nodo_id, nombre, umbral_voltaje, umbral_corriente, umbral_potencia, creado_en (V202611222130__nodos_sensores_lecturas.sql).
<!-- fin -->

<!-- entrada: tabla lecturas -->
- Tabla `lecturas`: id, sensor_id, voltaje, corriente, potencia, tomada_en (V202611222130__nodos_sensores_lecturas.sql).
<!-- fin -->

<!-- entrada: tabla alertas -->
- Tabla `alertas`: id, sensor_id, magnitud, valor, umbral, creada_en (V202611222300__alertas.sql).
<!-- fin -->

<!-- entrada: tabla nodo_topologia -->
- Tabla `nodo_topologia`: nodo_id, tipo, x, y, actualizado_en (V202611222330__topologia.sql).
<!-- fin -->

<!-- entrada: tabla enlaces -->
- Tabla `enlaces`: id, origen_id, destino_id, creado_en (V202611222330__topologia.sql).
<!-- fin -->

<!-- entrada: modulo aislamiento -->
- Módulo `aislamiento`: puntos de extensión paneles.ts.
<!-- fin -->

<!-- entrada: modulo alertas -->
- Módulo `alertas`: puntos de extensión (ninguno).
<!-- fin -->

<!-- entrada: modulo auth -->
- Módulo `auth`: puntos de extensión (ninguno).
<!-- fin -->

<!-- entrada: modulo dashboard -->
- Módulo `dashboard`: puntos de extensión menu.ts.
<!-- fin -->

<!-- entrada: modulo estado -->
- Módulo `estado`: puntos de extensión (ninguno).
<!-- fin -->

<!-- entrada: modulo inicio -->
- Módulo `inicio`: puntos de extensión menu.ts.
<!-- fin -->

<!-- entrada: modulo lecturas -->
- Módulo `lecturas`: puntos de extensión (ninguno).
<!-- fin -->

<!-- entrada: modulo nodos -->
- Módulo `nodos`: puntos de extensión menu.ts.
<!-- fin -->

<!-- entrada: modulo sensores -->
- Módulo `sensores`: puntos de extensión paneles.ts.
<!-- fin -->

<!-- entrada: modulo simulador -->
- Módulo `simulador`: puntos de extensión paneles.ts.
<!-- fin -->

<!-- entrada: modulo topologia -->
- Módulo `topologia`: puntos de extensión (ninguno).
<!-- fin -->

<!-- entrada: modulo ui -->
- Módulo `ui`: puntos de extensión (ninguno).
<!-- fin -->

<!-- entrada: semilla auth.sql -->
- Semilla `db/seed/auth.sql`.
<!-- fin -->

<!-- entrada: semilla nodos.sql -->
- Semilla `db/seed/nodos.sql`.
<!-- fin -->

<!-- entrada: semilla sensores.sql -->
- Semilla `db/seed/sensores.sql`.
<!-- fin -->

<!-- entrada: semilla topologia.sql -->
- Semilla `db/seed/topologia.sql`.
<!-- fin -->

<!-- entrada: ruta /api/auth/login -->
- Ruta `/api/auth/login`: POST.
<!-- fin -->

<!-- entrada: ruta /api/auth/logout -->
- Ruta `/api/auth/logout`: POST.
<!-- fin -->

<!-- entrada: ruta /api/health -->
- Ruta `/api/health`: GET.
<!-- fin -->

<!-- entrada: ruta /api/metrics -->
- Ruta `/api/metrics`: GET.
<!-- fin -->

<!-- entrada: ruta /api/nodos -->
- Ruta `/api/nodos`: GET, POST.
<!-- fin -->

<!-- entrada: ruta /api/nodos/{id} -->
- Ruta `/api/nodos/{id}`: GET, PATCH, DELETE.
<!-- fin -->

<!-- entrada: ruta /api/aislamiento/nodos/{id} -->
- Ruta `/api/aislamiento/nodos/{id}`: PATCH.
<!-- fin -->

<!-- entrada: ruta /api/sensores -->
- Ruta `/api/sensores`: GET, POST.
<!-- fin -->

<!-- entrada: ruta /api/sensores/{id} -->
- Ruta `/api/sensores/{id}`: GET, PATCH, DELETE.
<!-- fin -->

<!-- entrada: ruta /api/simulador -->
- Ruta `/api/simulador`: POST.
<!-- fin -->

<!-- entrada: ruta /api/lecturas -->
- Ruta `/api/lecturas`: GET.
<!-- fin -->

<!-- entrada: ruta /api/alertas -->
- Ruta `/api/alertas`: GET.
<!-- fin -->

<!-- entrada: ruta /api/topologia -->
- Ruta `/api/topologia`: GET.
<!-- fin -->

<!-- entrada: ruta /api/topologia/nodos/{id} -->
- Ruta `/api/topologia/nodos/{id}`: PUT.
<!-- fin -->

<!-- entrada: ruta /api/topologia/enlaces -->
- Ruta `/api/topologia/enlaces`: POST.
<!-- fin -->

<!-- entrada: ruta /api/topologia/enlaces/{id} -->
- Ruta `/api/topologia/enlaces/{id}`: DELETE.
<!-- fin -->

<!-- entrada: ruta /api/estado -->
- Ruta `/api/estado`: GET.
<!-- fin -->

<!-- entrada: ruta /api/estado/nodos/{id} -->
- Ruta `/api/estado/nodos/{id}`: GET.
<!-- fin -->
