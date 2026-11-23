# Rediseño SCADA: plan y decisiones

Rama larga `ui/scada`, sin issue. Cada prueba nueva lleva el prefijo `ui-scada:`. Cada fase deja la app en verde (`lint`, `typecheck`, `test:unit`, `test:integration`, `build`) y tiene su propio commit. Antes de pasar a la siguiente fase se espera el visto bueno.

## Línea base (antes de F0)

Primera carga de JS por ruta, sacada de `.next/diagnostics/route-bundle-stats.json` y comprimida con gzip:

| Ruta | Sin comprimir | gzip |
|---|---|---|
| `/dashboard` | 814,3 KiB | 238,1 KiB |
| `/nodos` | 459,3 KiB | 137,3 KiB |
| `/`, `/nodos/[id]` | 457,9 KiB | 136,7 KiB |
| `/login` | 449,4 KiB | 133,4 KiB |

Recharts pesa unos 100 KiB gzip de los 238 KiB de `/dashboard`. Las minigráficas nuevas son SVG propio (`Sparkline`), así que el dashboard puede dejar de cargar Recharts. Se va a medir otra vez al cerrar F3, F4 y F6.

## Fases

| Fase | Contenido | Archivos principales |
|---|---|---|
| **F0** | Este plan, tokens de diseño y componentes base | `globals.css`, `src/modulos/ui/` |
| **F1** | Shell (barra superior, menú lateral colapsable con iconos), franja de KPI y nuevo estilo de `/nodos`, la ficha, el login y los paneles existentes | `(tablero)/layout.tsx`, `src/modulos/ui/shell/`, páginas |
| **F2** | Topología: migración, `src/modulos/topologia/{schema,service,repo}.ts`, API con Zod, contrato y semilla `db/seed/topologia.sql` con unos 12 nodos | `db/migration/V…__topologia.sql`, `src/app/api/topologia/` |
| **F3** | Mímico estático en SVG: símbolos por tipo, enlaces, colores por estado, zoom, arrastre, encuadre y tooltip | `src/modulos/topologia/ui/Mimico*.tsx` |
| **F4** | `GET /api/estado`, sondeo cada 2,5 s, simulador continuo (`SIM_AUTO_MS`) con poda, panel lateral, panel de alarmas y avisos | `src/modulos/estado/`, `src/instrumentation.ts` |
| **F5** | Editor del administrador: arrastrar nodos, crear y borrar enlaces y guardar | `src/modulos/topologia/ui/Editor*.tsx`, `PUT`/`POST`/`DELETE` |
| **F6** | Pulido: accesibilidad, reduced-motion, estados vacíos, rendimiento, capturas a 1440, 1024 y 768 px, README | — |

## Decisiones

1. **Tema.** Oscuro por defecto. El tema claro queda con sus tokens en `[data-tema="claro"]`, pero sin selector en la interfaz hasta que se confirme (YAGNI).
2. **Tokens.** Los valores crudos van en `:root` (`--sc-*`) y se exponen a Tailwind con `@theme inline` (`bg-panel`, `text-tenue`, `text-critico`…). Cambiar de tema solo cambia variables, no clases.
3. **Estados.** Son cinco: `normal`, `advertencia`, `critico`, `desconectado` y `sin-datos`. Cada uno tiene color, **forma** (círculo, triángulo, octágono, círculo tachado y círculo punteado) y etiqueta de texto, para no depender solo del color.
4. **Nivel frente a un umbral.** Un valor por encima del umbral es `critico` (es lo que hoy genera una alerta). Un valor desde el 90 % del umbral es `advertencia`. Sin umbral, el valor es `normal`, y sin valor es `sin-datos`. La función es pura (`nivelFrenteAUmbral`) y la usan el medidor, el mímico y los KPI.
5. **Medidor.** Es una barra horizontal con una marca en el umbral (`role="meter"`), no un arco: se lee mejor en poco espacio y es más liviana. La escala llega hasta `max(umbral × 1,25, valor)`.
6. **Tipografía.** Pila del sistema, sin fuentes externas (la CSP ya restringe `font-src`). Las cifras usan `tabular-nums` con monoespaciada para que no "bailen" al actualizarse.
7. **Movimiento.** Toda animación se define en CSS y se anula con `@media (prefers-reduced-motion: reduce)`.
8. **Paneles de otros módulos** (sensores y simulador) usan clases `gray-*` pensadas para fondo claro. En F1 se les cambia el estilo a los tokens, sin tocar su lógica ni el contrato de `paneles.ts`.
9. **Worktree.** La sesión trabaja en un worktree creado por la app de escritorio, con la rama renombrada a `ui/scada`. Las reglas de git no cambian: nada de rebase, amend, reset ni force push, y `main` se trae con `git merge`.
