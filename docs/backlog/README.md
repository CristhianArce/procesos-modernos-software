# Backlog de historias de usuario

Cada historia tiene su archivo en esta carpeta (el cuerpo del issue de GitHub) y una fila en esta tabla. Se crean con el skill `crear-hu`. El número HU es el de [la propuesta](../propuesta.md), sección 5; el issue es el número que asignó GitHub.

| HU | Título | Fase | Issue | Depende de | CA |
|---|---|---|---|---|---|
| 1a | [Configurar la IA del flujo SDD (OpenSpec, agentes, skills)](hu-01a-configurar-la-ia-del-flujo-sdd.md) | Habilitadora | #1 | HU 1b (#2) y HU 2 solo para CA-6 y CA-7 | 7 |
| 1b | [Preparar las herramientas de desarrollo del proyecto](hu-01b-preparar-las-herramientas-de-desarrollo-del-proyecto.md) | Habilitadora | #2 | – (su change espera el `openspec init` de la HU 1a, #1) | 7 |
| 2 | [Preparar infraestructura y CI/CD del proyecto](hu-02-preparar-infraestructura-y-ci-cd-del-proyecto.md) | Habilitadora | #18 | HU 1a (#1) y HU 1b (#2) | 9 |
| 3 | [Iniciar sesión con roles de administrador y técnico](hu-03-iniciar-sesion-con-roles-de-administrador-y-tecnico.md) | Línea base | #20 | HU 2 (#18) | 7 |
| 4 | [Administrar nodos y sensores con simulador de lecturas](hu-04-administrar-nodos-y-sensores-con-simulador-de-lecturas.md) | Línea base | #21 | HU 3 (#20) | 7 |
| 5 | [Ver el dashboard con lecturas, gráficas y alertas por umbral](hu-05-ver-el-dashboard-con-lecturas-graficas-y-alertas-por-umbral.md) | Línea base | #22 | HU 4 (#21) | 7 |
| 6 | [Aislar un nodo de la red](hu-06-aislar-un-nodo-de-la-red.md) | Clase | #23 | HU 4 (#21) | 4 |
| 7 | [Notificar a los técnicos cuando salta una alerta](hu-07-notificar-a-los-tecnicos-cuando-salta-una-alerta.md) | Clase | #24 | HU 5 (#22) | 6 |
| 8 | [Registrar los usuarios o dispositivos afectados por un nodo](hu-08-registrar-los-usuarios-o-dispositivos-afectados-por-un-nodo.md) | Clase | #25 | HU 4 (#21) | 6 |
| 9 | [Consultar el histórico de lecturas y exportarlo a CSV](hu-09-consultar-el-historico-de-lecturas-y-exportarlo-a-csv.md) | Clase | #26 | HU 4 (#21) | 6 |
| 10 | [Registrar mantenimiento y asignar un técnico a un nodo](hu-10-registrar-mantenimiento-y-asignar-un-tecnico-a-un-nodo.md) | Clase | #27 | HU 3 (#20) y HU 4 (#21) | 6 |
