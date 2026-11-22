# Contexto del repositorio

Generado por `contexto.mjs`. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.

## Capacidades especificadas

Comportamiento ya especificado en `openspec/specs/`. Si la historia cambia una de estas capacidades, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito; no se crea otra capacidad para lo mismo.

| Capacidad | Propósito | Requisitos |
|---|---|---|
| acceso-tablero | Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de redirigir, para que cada historia solo declare qué rol exige. | Páginas del tablero redirigen sin sesión; API protegida responde 401 y 403 en JSON |
| calidad-proyecto | Garantiza que cualquier integrante o agente pueda instalar el proyecto desde un clon limpio y correr lint, typecheck, pruebas y build con el mismo resultado, sin que el trabajo en curso de otras historias lo afecte. | Comandos de calidad en verde desde un clon limpio; Carpetas de trabajo de los agentes ignoradas |
| despliegue-publico | Mantiene una instancia pública de la app, en un servicio gratuito, que ejecuta siempre la última imagen publicada por el CD, sin guardar secretos en el repositorio y sin pasos manuales después de cada merge. | Servicio público con la imagen publicada; Aviso a Render desde el CD; Secretos del servicio fuera del repositorio; Base de datos del servicio público; Migraciones y semillas en el CD |
| entorno-local | Permite que cualquier integrante levante la base de datos, aplique las migraciones y arranque la app en su portátil con `docker compose`, con un error claro si falta configuración y sin que varios entornos se pisen los puertos. | Arranque local completo; Variables obligatorias; Puertos del host que no chocan |
| extension-modulos | Deja que cada historia agregue su ítem de menú, su panel en la ficha del nodo y su suscriptor de alertas declarándolos en su propio módulo, sin editar el núcleo ni los archivos de otras historias. | Descubrimiento de extensiones por módulo; Menú filtrado por rol |
| inicio-de-sesion | Permite que un administrador o un técnico inicie y cierre sesión con su nombre de usuario y su contraseña, y que el tablero y la API reconozcan esa sesión y su rol, para que cada historia solo decida qué rol exige. | Inicio de sesión con credenciales válidas; Credenciales incorrectas sin pistas; Validación del cuerpo del login; Límite de intentos fallidos; Acceso con la sesión emitida por el login; Endpoints reservados a administradores; Cierre de sesión |
| integracion-continua | Detecta de forma automática, en cada PR y con poco tiempo de espera, que una historia rompió la calidad del proyecto o la imagen, y revisa secretos y vulnerabilidades al fusionar en `main`. | Validación de cada PR; La imagen se construye y arranca en cada PR; Controles de seguridad solo al fusionar en main |
| observabilidad | Permite saber si la app está viva, medir su tráfico HTTP en formato Prometheus sin exponer las métricas a cualquiera, y registrar cada petición de forma estructurada sin filtrar datos sensibles. | Salud de la app sin autenticación; Métricas protegidas por token; Log estructurado de cada petición sin datos sensibles |
| plantillas-y-etiquetas | Da al equipo y al orquestador el mismo formato al abrir historias y PR, pide revisores por defecto y deja creadas las etiquetas que el flujo aplica con `gh`, que falla si una etiqueta no existe. | Plantillas de historia y de PR; Etiquetas del flujo; Revisores por defecto |
| publicacion-imagen | Deja la imagen de la app publicada y actualizada en el registro de GitHub después de cada cambio de código en `main`, para que cualquiera la ejecute sin construirla. | Publicación al fusionar en main; Imagen pública y ejecutable; Permisos mínimos del CD |

## Changes activos

- openspec/changes/configuracion-ia-sdd/
- openspec/changes/nodos-sensores-y-simulador/

## Tablas y columnas

| Tabla | Columnas | Migraciones |
|---|---|---|
| usuarios | id, nombre_usuario, contrasena_hash, rol, creado_en | V202611221930__usuarios.sql |
| nodos | id, nombre, ubicacion, estado, creado_en | V202611222130__nodos_sensores_lecturas.sql |
| sensores | id, nodo_id, nombre, umbral_voltaje, umbral_corriente, umbral_potencia, creado_en | V202611222130__nodos_sensores_lecturas.sql |
| lecturas | id, sensor_id, voltaje, corriente, potencia, tomada_en | V202611222130__nodos_sensores_lecturas.sql |

## Módulos y puntos de extensión

| Módulo | Puntos de extensión |
|---|---|
| auth | (ninguno) |
| inicio | menu.ts |
| lecturas | (ninguno) |
| nodos | menu.ts |
| sensores | paneles.ts |
| simulador | paneles.ts |

## Semillas

- db/seed/auth.sql
- db/seed/nodos.sql
- db/seed/sensores.sql

## Rutas del contrato

| Ruta | Métodos |
|---|---|
| /api/auth/login | POST |
| /api/auth/logout | POST |
| /api/health | GET |
| /api/metrics | GET |
| /api/nodos | GET, POST |
| /api/nodos/{id} | GET, PATCH, DELETE |
| /api/sensores | GET, POST |
| /api/sensores/{id} | GET, PATCH, DELETE |
| /api/simulador | POST |
