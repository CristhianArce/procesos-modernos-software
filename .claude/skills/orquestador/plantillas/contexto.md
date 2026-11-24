# Contexto del repositorio

Generado por `contexto.mjs`. Empieza por el **negocio** y sigue con lo **técnico**. Toda tabla, columna o módulo que use la propuesta debe aparecer aquí; si no aparece, es una pregunta, no un supuesto.

## Producto

Qué hace la aplicación y el backlog de historias, con lo que cada una entrega y de cuál depende (`docs/propuesta.md` §1 y §5).

## Reglas de negocio de las historias construidas

Las `RN-n`, lo fuera de alcance y las decisiones de la persona de cada historia ya construida (`evidencias/issue-<n>/`).

## Reglas de negocio vigentes (specs)

Cada requisito de `openspec/specs/` y de los changes en curso, con su texto completo y los nombres de sus escenarios. Las capacidades de plataforma y proceso (`plataforma` en `.claude/orquestador.json`) van solo por nombre.

## Capacidades especificadas

Comportamiento ya especificado en `openspec/specs/`. Si la historia cambia una de estas capacidades, su delta usa `## MODIFIED Requirements` con el nombre exacto del requisito; no se crea otra capacidad para lo mismo.

| Capacidad | Propósito | Requisitos |
|---|---|---|

## Changes activos

## Tablas y columnas

| Tabla | Columnas | Migraciones |
|---|---|---|

## Módulos y puntos de extensión

| Módulo | Puntos de extensión |
|---|---|

## Semillas

## Rutas del contrato

| Ruta | Métodos |
|---|---|

## Módulo de referencia

Patrón a seguir (nombres, capas y forma de las pruebas) en lugar de explorar el repo. Son rutas, no contenido.

## Firmas públicas

Lo que exporta cada módulo (`schema.ts`, `repo.ts`, `service.ts`), para citar nombres reales y escribir `## Interfaces` sin abrir el código.

## Compartido: núcleo y componentes

Se reutiliza, no se reescribe ni se edita: `src/lib/`, `src/modulos/ui/` y `src/test/`.

## Convenciones del repo

Nombres, última migración, mensajes de error, `data-testid` y clases del sistema de diseño que el código ya usa.

## Herramientas y modismos

Librerías fijas, scripts de npm, proyectos de Vitest, Playwright, Postgres, Flyway y tokens de diseño.

## Reglas del proyecto (resumen de CLAUDE.md §3 a §7)

Copiadas de `CLAUDE.md`, que es la fuente.
