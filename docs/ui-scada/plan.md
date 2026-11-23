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
4. **Nivel frente a un umbral.** Un valor por encima del umbral es `critico` (es lo que hoy genera una alerta). Un valor desde el 98 % del umbral es `advertencia` (con el 90 %, una tensión nominal de 120 V frente a 125 V ya saldría en advertencia; cambiado en F1). Sin umbral, el valor es `normal`, y sin valor es `sin-datos`. La función es pura (`nivelFrenteAUmbral`) y la usan el medidor, el mímico y los KPI.
5. **Medidor.** Es una barra horizontal con una marca en el umbral (`role="meter"`), no un arco: se lee mejor en poco espacio y es más liviana. La escala llega hasta `max(umbral × 1,25, valor)`.
6. **Tipografía.** Pila del sistema, sin fuentes externas (la CSP ya restringe `font-src`). Las cifras usan `tabular-nums` con monoespaciada para que no "bailen" al actualizarse.
7. **Movimiento.** Toda animación se define en CSS y se anula con `@media (prefers-reduced-motion: reduce)`.
8. **Paneles de otros módulos** (sensores y simulador) usan clases `gray-*` pensadas para fondo claro. En F1 se les cambia el estilo a los tokens, sin tocar su lógica ni el contrato de `paneles.ts`.
9. **Worktree.** La sesión trabaja en un worktree creado por la app de escritorio, con la rama renombrada a `ui/scada`. Las reglas de git no cambian: nada de rebase, amend, reset ni force push, y `main` se trae con `git merge`.
10. **Alertas activas.** El modelo no tiene confirmación de alarmas, así que una alerta cuenta como activa durante los 15 minutos siguientes a su registro (`VENTANA_ALERTAS_MIN`). La misma ventana define la tendencia de los KPI: 30 puntos de 30 s.
11. **Agregado por nodo.** De la última lectura de cada sensor salen la tensión media y la suma de la corriente y de la potencia del nodo. El nivel del nodo es el peor de sus sensores y magnitudes. Si el nodo está desconectado, su nivel es `desconectado`, sin importar las lecturas. La potencia total y la tensión media de la red solo cuentan los nodos conectados que tienen datos. El cálculo vive en `src/modulos/estado/calculo.ts` (puro) y el SQL, en `src/modulos/estado/repo.ts`.
12. **Iconos del menú.** El contrato de `menu.ts` (`ItemMenu`) no cambia: el shell elige el icono por ruta (`src/shell/iconos-menu.ts`) y usa uno genérico para los módulos que no conoce.
13. **Shell fuera del núcleo.** La prueba `#2 CA-4` exige que `layout.tsx` no nombre ningún módulo. Por eso el shell vive en `src/shell/` (como `src/nav/`) y el layout solo le pasa la sesión y el menú. La preferencia de menú plegado va en una cookie, para que el servidor pinte igual y no haya parpadeo. En tableta (< 1024 px) el menú queda siempre en modo iconos.
14. **Tendencia de nodos desconectados.** No hay historia del estado de conexión de los nodos, así que ese KPI muestra «Sin historial» en vez de inventar una serie.
15. **e2e.** En `e2e/nodos.spec.ts`, la conexión ahora se muestra con el indicador («Conectado», con mayúscula); se ajustaron las dos aserciones.
16. **`pg` como externo síncrono** (corrección de un fallo que ya estaba en `main`). Con `import { Pool } from "pg"`, Turbopack carga `pg` como externo ESM, que es asíncrono. Todo módulo que llega a la BD se vuelve asíncrono, y el `import.meta.glob` eager de `src/nav/registro.ts` recibe un espacio de nombres que nunca se llena. Por eso el panel Sensores no salía en la ficha, ni en desarrollo ni en producción, y la e2e `#21 CA-7` fallaba. `src/lib/db.ts` ahora carga `pg` con `require` (externo CommonJS). La salida `standalone` sigue incluyendo `pg`. Es un cambio al núcleo, aprobado en la conversación.
17. **Topología (F2).** Las tablas son propias: `nodo_topologia(nodo_id, tipo, x, y)`, con coordenadas de 0 a 2000, y `enlaces(origen_id, destino_id)`, que no admite bucles y tiene un índice único por par de nodos sin importar el sentido. Las dos borran en cascada con el nodo. El sentido del enlace es el del flujo de energía. Un nodo sin posición sale en la API con `tipo`, `x` e `y` nulos. La semilla `topologia.sql` usa identificadores `…-9000-…` para no alterar los conteos de la semilla de la HU 4. Agrega 11 nodos a los 2 existentes (13 en total, uno desconectado), 13 enlaces, 12 sensores y 30 lecturas con deriva suave por sensor; ninguna lectura supera un umbral, así que no quedan alertas sin evaluar.
18. **Mímico (F3).** Es SVG propio (`src/modulos/topologia/ui/Mimico.tsx`) y los cálculos son puros (`mimico.ts`).
    - **Zoom y arrastre:** cambian el `viewBox`. Las coordenadas de pantalla se convierten con `getScreenCTM()`, así que se respeta `preserveAspectRatio`.
    - **Flujo:** cada enlace fluye con la potencia del nodo destino. El grosor va de 2 a 6 y el ciclo, de 2,5 s a 0,6 s. Si uno de los extremos está desconectado, el enlace queda discontinuo y sin flujo.
    - **Nodos sin ubicar:** se dibujan en una fila debajo de la red, como carga, con la etiqueta «sin ubicar».
    - **Teclado:** cada nodo es un `role="button"` enfocable; el tooltip sale con el foco y Enter abre la ficha. En F4, Enter abrirá el panel lateral.
    - **Lector de pantalla:** hay un resumen en texto (`aria-describedby`).
19. **Gráficas sin Recharts.** Las tres gráficas por sensor ahora son SVG propio (`GraficaLinea`), renderizado en el servidor y sin JS en el cliente. Siguen cumpliendo los criterios de la historia #22 (tres gráficas con título por sensor). La e2e de la #22 se ajustó de `svg.recharts-surface` a `figure svg[role=img]`. Recharts sigue en `package.json` (sin cambios de dependencias), pero ninguna ruta lo carga. Si el equipo lo aprueba, se puede quitar aparte.

## Medidas de JS (primera carga, gzip)

| Ruta | Antes de F0 | F1 | F3 |
|---|---|---|---|
| `/dashboard` | 238,1 KiB | 239,6 KiB | **141,0 KiB** (−41 %) |
| `/nodos` | 137,3 KiB | 140,2 KiB | 139,6 KiB |
| `/login` | 133,4 KiB | 133,4 KiB | 132,7 KiB |

## Decisiones de F4 (datos en vivo)

20. **Severidad de las alarmas.** El modelo tiene una sola severidad (RN-3 de la #22), así que se deriva del exceso sobre el umbral: *alta* desde +10 % y *media* por debajo. El panel ordena por severidad y, dentro de cada una, por hora. También se puede ordenar solo por hora, que es el orden del CA-4 de la #22. No hay confirmación de alarmas. `ListaAlertas` (la tabla de la #22) se retiró junto con su prueba, porque el panel de alarmas la reemplaza; la e2e de la #22 sigue usando `data-testid="alerta"`.
21. **Instantánea en vivo.**
    - **`GET /api/estado`:** viaja sin nombres y con cifras de 2 decimales, con `no-store`, y trae las 30 alertas más recientes.
    - **Sondeo:** el proveedor `ProveedorEstadoVivo` está en el shell, así que la barra superior está en vivo en todas las pantallas. Consulta cada 2,5 s con un bucle de `setTimeout`, se pausa con la pestaña oculta, muestra «Sin conexión» si falla y lleva a `/login` con un 401.
    - **Repintado:** los nodos, enlaces y alertas que no cambiaron conservan su objeto, y los nodos y enlaces del mímico se memorizan con comparación por valor.
    - **Avisos:** hay uno por sensor y magnitud (uno nuevo reemplaza al anterior), dura 8 s y se ven como mucho 3.
    - **Parpadeo:** el nodo con una alerta nueva parpadea mientras dura su aviso.
22. **Panel lateral.** `GET /api/estado/nodos/{id}` trae los sensores con sus umbrales, sus 30 últimas lecturas y las 10 alertas recientes del nodo. Se vuelve a pedir con cada instantánea.
    - **Contenido:** medidores frente a los umbrales y minigráficas por magnitud.
    - **Teclado:** Enter lo abre, el foco pasa a su título, Esc lo cierra y el foco vuelve al nodo.
23. **Simulador continuo.** Se enciende con `SIM_AUTO_MS` (≥ 500) desde `src/instrumentation.ts`; está apagado por defecto y nunca corre durante el build.
    - **Deriva:** cada paso se acerca un 20 % a la base, con ruido de ±0,8 V y ±4 % de la corriente.
    - **Base:** la tensión es de 120 V. La corriente sale de la última lectura, pero queda por debajo del 80 % de los umbrales de corriente y de potencia, porque una lectura vieja del botón puede estar por encima.
    - **Picos:** hay un 0,5 % de probabilidad de pico por sensor y paso, con un exceso de entre +2 % y +15 % del umbral. El pico no arrastra la deriva.
    - **Alcance:** omite los nodos desconectados y evalúa las alertas con `registrarAlertas`, el mismo camino que el botón.
    - **Poda:** una vez por minuto borra las lecturas de más de 60 min, salvo la última de cada sensor.
    - **En desarrollo:** el ciclo se arranca una sola vez por proceso, así que un cambio en su código exige reiniciar `next dev`.
24. **Zod fuera del navegador.** `MAGNITUDES` y `TIPOS_NODO` se movieron a archivos sin Zod (`alertas/magnitudes.ts`, `topologia/tipos.ts`) y sus `schema.ts` los reexportan. Ninguna ruta carga Zod en el cliente.

| Ruta | Antes de F0 | F3 | F4 |
|---|---|---|---|
| `/dashboard` (gzip) | 238,1 KiB | 141,0 KiB | 147,4 KiB |
| `/nodos` (gzip) | 137,3 KiB | 139,6 KiB | 141,5 KiB |

## Decisiones de F5 (editor del administrador)

25. **Editor.** El reductor es puro (`src/modulos/topologia/editor.ts`). Las posiciones quedan *pendientes* hasta pulsar «Guardar posiciones», que hace un `PUT` por cada nodo que cambió de verdad. Los enlaces, en cambio, se crean y se borran al momento (`POST`/`DELETE`) y la topología se vuelve a leer.
    - **Movimiento:** arrastrando con el ratón o con las flechas (Mayús: pasos de 50), con ajuste a una retícula de 10 y dentro del lienzo.
    - **Enlaces:** se eligen dos nodos, por clic o Enter, y el enlace va del primero al segundo; elegir el mismo nodo cancela. Para borrar, se elige el enlace (una línea ancha invisible que es un botón enfocable) y luego «Borrar enlace».
    - **Tipo:** el nodo elegido puede cambiar de tipo, lo que sirve para ubicar los nodos «sin ubicar».
    - **Salir:** si hay posiciones sin guardar, pide confirmación.
    - **Panel lateral:** no se abre mientras se edita.
26. **Rol.** El dashboard solo monta la barra del editor si la sesión es de administrador. Ocultarla es cosmético: la API de topología responde 403 al técnico, y lo prueban las pruebas de integración y `e2e/topologia.spec.ts`.
27. **Topología en el cliente.** El dashboard la guarda en su estado y la vuelve a leer al editar o si la instantánea trae nodos distintos (un nodo creado o borrado en otra pantalla aparece sin recargar la página).
28. **e2e del CA-4** (`e2e/topologia.spec.ts`): mover un nodo con el teclado y guardar, crear y borrar un enlace, y comprobar que el técnico no ve los controles y recibe 403. Las pruebas devuelven la topología a su estado inicial. Están listadas con `npx playwright test --list`, pero no se ejecutaron porque falta el Chromium de Playwright; los mismos flujos se verificaron en el navegador integrado.

| Ruta | Antes de F0 | F4 | F5 |
|---|---|---|---|
| `/dashboard` (gzip) | 238,1 KiB | 147,4 KiB | 150,1 KiB |
