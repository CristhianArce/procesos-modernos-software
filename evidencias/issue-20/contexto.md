# Contexto del repositorio

Generado por `contexto.mjs`. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.

## Capacidades especificadas

Comportamiento ya especificado en `openspec/specs/`. Si la historia cambia una de estas capacidades, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito; no se crea otra capacidad para lo mismo.

| Capacidad | Propósito | Requisitos |
|---|---|---|
| despliegue-publico | Mantiene una instancia pública de la app, en un servicio gratuito, que ejecuta siempre la última imagen publicada por el CD, sin guardar secretos en el repositorio y sin pasos manuales después de cada merge. | Servicio público con la imagen publicada; Aviso a Render desde el CD; Secretos del servicio fuera del repositorio; Base de datos del servicio público; Migraciones y semillas en el CD |
| entorno-local | Permite que cualquier integrante levante la base de datos, aplique las migraciones y arranque la app en su portátil con `docker compose`, con un error claro si falta configuración y sin que varios entornos se pisen los puertos. | Arranque local completo; Variables obligatorias; Puertos del host que no chocan |
| integracion-continua | Detecta de forma automática, en cada PR y con poco tiempo de espera, que una historia rompió la calidad del proyecto o la imagen, y revisa secretos y vulnerabilidades al fusionar en `main`. | Validación de cada PR; La imagen se construye y arranca en cada PR; Controles de seguridad solo al fusionar en main |
| plantillas-y-etiquetas | Da al equipo y al orquestador el mismo formato al abrir historias y PR, pide revisores por defecto y deja creadas las etiquetas que el flujo aplica con `gh`, que falla si una etiqueta no existe. | Plantillas de historia y de PR; Etiquetas del flujo; Revisores por defecto |
| publicacion-imagen | Deja la imagen de la app publicada y actualizada en el registro de GitHub después de cada cambio de código en `main`, para que cualquiera la ejecute sin construirla. | Publicación al fusionar en main; Imagen pública y ejecutable; Permisos mínimos del CD |

## Changes activos

- openspec/changes/configuracion-ia-sdd/
- openspec/changes/herramientas-desarrollo/

## Tablas y columnas

| Tabla | Columnas | Migraciones |
|---|---|---|
| (ninguna) | | |

## Módulos y puntos de extensión

| Módulo | Puntos de extensión |
|---|---|
| inicio | menu.ts |

## Semillas

- (ninguna)

## Rutas del contrato

| Ruta | Métodos |
|---|---|
| /api/health | GET |
| /api/metrics | GET |
