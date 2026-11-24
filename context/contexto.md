# Contexto del repositorio

Contexto acumulado del producto, versionado en `context/`. `contexto.mjs` lo **amplía**: agrega lo nuevo y reemplaza solo la entrada que cambió, sin borrar nada ni regenerarlo entero. Lee este índice y, de las partes, solo las que tu paso indica. Empieza por el **negocio** (qué promete ya el producto, qué reglas rigen y qué decidió la persona) y sigue con lo **técnico**. Toda tabla, columna o módulo que use la propuesta debe aparecer en las partes; si no aparece, es una pregunta, no un supuesto. Una regla nueva no contradice una vigente: si la historia cambia una, su delta es `## MODIFIED Requirements` y se le pregunta a la persona. Las reglas de `CLAUDE.md` ya están cargadas: no se repiten aquí.

## Qué leer en cada paso

| Paso | Lee (en `context/`) |
|---|---|
| 3 Propuesta (la sesión) | `producto.md`, `historias.md`, `inventario.md` y `negocio/<capacidad>.md` de las capacidades del issue |
| 4 Revisar la propuesta (`revisor-salida`) | `inventario.md`, `historias.md` y `negocio/<capacidad>.md` de las capacidades del change |
| 5 Implementar (la sesión) | `codigo.md`, `convenciones.md` y, si hay duda, `negocio/<capacidad>.md` |
| 5 Escribir pruebas (`escritor-pruebas`) | `codigo.md`, `convenciones.md` y `negocio/<capacidad>.md` de la capacidad del change |

Qué capacidades leer: las que el issue nombra o cuyo módulo toca (un issue sobre sensores lee `nodos-y-sensores`). Ante la duda, lee de más: una regla que falta cuesta más que un archivo de sobra. Varias lecturas van en un mismo mensaje.

## Partes

| Archivo | Contenido | Tamaño |
|---|---|---|
| `context/producto.md` | resumen y backlog de historias con sus dependencias | 3.0 KB |
| `context/historias.md` | RN, fuera de alcance y decisiones de la persona de cada historia construida | 7.7 KB |
| `context/inventario.md` | capacidades, changes activos, tablas, módulos, semillas y rutas | 9.0 KB |
| `context/codigo.md` | módulo de referencia, firmas públicas y lo compartido | 14.3 KB |
| `context/convenciones.md` | convenciones del repo, librerías, Vitest, Playwright, Postgres, Flyway y diseño | 4.0 KB |

## Capacidades de negocio

Cada una tiene su parte con los requisitos completos y los nombres de sus escenarios.

| Capacidad | Propósito | Parte | Tamaño |
|---|---|---|---|
| acceso-tablero | Fija el control de acceso base del tablero: las páginas sin sesión llevan al login y la API protegida responde errores JSON en lugar de redirigir, para que cada historia solo declare qué rol exige. | `context/negocio/acceso-tablero.md` | 1.3 KB |
| aislamiento-de-nodos | Permite que un administrador aísle un nodo de la red (lo deja desconectado) y lo reconecte desde su ficha, para cortar el suministro de un tramo con falla sin afectar al resto. Ambas transiciones son simuladas: solo cambian el estado guardado del nodo, sin órdenes a equipos reales. | `context/negocio/aislamiento-de-nodos.md` | 3.7 KB |
| alertas-por-umbral | Registra una alerta cada vez que una lectura supera el umbral máximo de su sensor en una magnitud, avisa a los módulos suscritos sin que el fallo de uno impida guardar la alerta, y deja consultar las alertas por la API. | `context/negocio/alertas-por-umbral.md` | 2.6 KB |
| dashboard-de-lecturas | Muestra en un dashboard, a cualquier usuario con sesión, la última lectura y la gráfica de cada sensor y las alertas más recientes, para detectar de un vistazo qué parte de la red tiene problemas, y deja consultar las lecturas por la API. | `context/negocio/dashboard-de-lecturas.md` | 3.0 KB |
| inicio-de-sesion | Permite que un administrador o un técnico inicie y cierre sesión con su nombre de usuario y su contraseña, y que el tablero y la API reconozcan esa sesión y su rol, para que cada historia solo decida qué rol exige. | `context/negocio/inicio-de-sesion.md` | 4.0 KB |
| nodos-y-sensores | Permite que un administrador cree y mantenga los nodos de la red y los sensores de cada nodo, y que administradores y técnicos consulten la lista de nodos y la ficha de cada uno, donde los módulos del tablero muestran sus paneles. | `context/negocio/nodos-y-sensores.md` | 4.9 KB |
| simulador-de-lecturas | Genera lecturas simuladas de voltaje, corriente y potencia para los sensores de un nodo, por la API o por un botón de la ficha, y deja consultable la última lectura de cada sensor, para probar el tablero sin hardware real. | `context/negocio/simulador-de-lecturas.md` | 3.0 KB |

## Plataforma y proceso (solo nombres)

No son reglas del producto: van solo por nombre (sus requisitos están en `inventario.md`). La lista está en `plataforma` de `.claude/orquestador.json`; una capacidad nueva cuenta como negocio hasta que se agregue ahí.

`agentes-sdd`, `calidad-proyecto`, `despliegue-publico`, `entorno-local`, `entorno-sdd`, `extension-modulos`, `integracion-continua`, `observabilidad`, `orquestador-sdd`, `plantillas-y-etiquetas`, `publicacion-imagen`
