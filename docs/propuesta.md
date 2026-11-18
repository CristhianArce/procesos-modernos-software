# Propuesta de arquitectura y SDD – Tablero de sensores eléctricos


## 1. Resumen

Construiremos un **tablero de sensores eléctricos** como monolito modular, desplegado en un único contenedor, con la mayor parte del esfuerzo puesto en lo que da nota: un flujo SDD trazable y una demo individual que cada estudiante pueda ejecutar en 5 a 10 minutos.

La aplicación permite administrar nodos y sensores de una red eléctrica, simular lecturas de voltaje, corriente y potencia, visualizarlas en un dashboard, generar alertas por umbral y, en las historias de clase, aislar nodos, notificar a técnicos y consultar el histórico.

**Principios de diseño**

- Menos piezas que se puedan romper: un solo contenedor, una sola base de datos, un solo lenguaje (TypeScript).
- Todo corre local con `docker compose up`, porque cada estudiante construye su historia en su propio portátil.
- Las historias de clase son independientes entre sí: cada una añade su carpeta, su tabla y su migración, y se enchufa en puntos de extensión ya construidos.
- Los agentes de IA hacen trabajo real y verificable: un PR por agente, un registro de actividad y al menos un rechazo documentado del agente de calidad.
- La infraestructura se reduce a dos servicios en una sola plataforma (un contenedor y Postgres), definidos en un archivo versionado.

Taller: Aplicación de Solución IA bajo Spec-Driven Development. Entrega: 24 de noviembre de 2026, 18:00. Modalidad objetivo: B (SDD multiagente, nota máxima 5.0).

## 2. Requisitos del taller y rúbrica

La demostración individual pesa más que cualquier otro criterio (40 %), así que el diseño prioriza que cada integrante domine el proceso por sí mismo.

| Criterio | Peso | Qué se evalúa |
| --- | --- | --- |
| Producto funcional | 30 % | Aplicación integrada, historias implementadas, despliegue, pruebas y seguridad |
| Aplicación de SDD | 30 % | Calidad y trazabilidad de especificaciones, planificación, implementación y validación |
| Demostración individual | 40 % | Cada estudiante construye una historia nueva en vivo, desde su computador, con SDD |

**Requisitos técnicos:** frontend integrado, backend con APIs y lógica de negocio, persistencia en base de datos, SDD con GitHub Spec Kit (preferida) u OpenSpec, despliegue en un entorno accesible y preferiblemente gratuito, pruebas automatizadas y prácticas básicas de seguridad, y un backlog de unas 10 historias (5 implementadas y 5 para desarrollar en clase).

**Modalidades:** la A (SDD con IA) tiene nota máxima de 4.5. La B (SDD con equipo de agentes) llega a 5.0, pero solo si se demuestra colaboración efectiva entre agentes; declararla no basta.

**Demostración presencial:** en la fase 1 el equipo presenta la app desplegada, las historias, las especificaciones, las pruebas, los controles de seguridad y la arquitectura de agentes. En la fase 2 cada estudiante recibe una historia del profesor y la especifica, implementa, prueba e integra en 5 a 10 minutos.

**Entregables:** repositorio, especificaciones y backlog, instrucciones de instalación y ejecución, enlace a la aplicación desplegada, evidencias de pruebas y seguridad, y descripción de la arquitectura multiagente.

## 3. Arquitectura

La aplicación es un monolito modular que se despliega como un solo contenedor y depende únicamente de Postgres; el pipeline de GitHub Actions solo construye, prueba y despliega.

```
                  ┌──────────── Contenedor único (Render · docker compose en local) ───────────┐
                  │  ┌──────────────────────────────────────────────┐                            │
┌───────────┐     │  │ Frontend React + Vite (estáticos)            │                            │
│ Navegador │     │  └──────────────────────┬───────────────────────┘                            │      ┌──────────────────┐
│  admin    │HTTPS│  ┌──────────────────────▼───────────────────────┐            SQL             │      │ Postgres         │
│  técnico  ├────►│  │ API Hono + Zod · JWT + roles · helmet · rate │───────────────────────────────────►│ Render Postgres  │
└───────────┘     │  └──────────────────────────────────────────────┘                            │      │ (Docker en local)│
                  │  Módulos: auth y roles · nodos y sensores · lecturas · simulador ·           │      └──────────────────┘
                  │           alertas · notificaciones                                           │
                  │  [ Historias 6 a 10 se enchufan por registro ]                               │
                  └──────────────────────────────────────▲──────────────────────────────────────┘
                                                         │ deploy hook
                               ┌─────────────────────────┴──────────────────────────┐
                               │ GitHub Actions: lint, pruebas, seguridad            │
                               └────────────────────────────────────────────────────┘
```

El navegador habla con la API por HTTPS. La API sirve también los estáticos del frontend, valida cada entrada con Zod y consulta Postgres. Las historias de clase (6 a 10) se enchufan mediante los registros de rutas y de paneles, sin tocar el núcleo. GitHub Actions ejecuta pruebas y escaneos de seguridad y despliega el contenedor.

| Componente | Responsabilidad |
| --- | --- |
| Frontend (React + Vite) | Login, tablero de nodos, gráficas de lecturas, alertas y paneles de las historias de clase |
| API (Hono + Zod) | Autenticación con JWT y roles, validación, lógica de negocio y contrato OpenAPI |
| Módulo `simulador` | Genera lecturas de voltaje, corriente y potencia con `POST /simulate`, un botón en la interfaz y un temporizador opcional |
| Módulo `alertas` | Compara cada lectura con los umbrales del sensor y registra la alerta |
| Módulo `notificaciones` | Guarda la notificación en una tabla y la muestra en un centro de notificaciones de la interfaz |
| Postgres | Usuarios, nodos, sensores, lecturas y alertas; migraciones con prefijo por historia |
| GitHub Actions | Lint, pruebas, gitleaks, `npm audit`, CodeQL o Semgrep y despliegue por webhook |

## 4. Stack tecnológico y decisiones

El stack es TypeScript de extremo a extremo en un monorepo, con un solo contenedor para API y estáticos, lo que reduce los puntos de fallo en la demo en vivo.

| Capa | Elección | Por qué |
| --- | --- | --- |
| SDD | OpenSpec + Claude Code | Admitida por el taller; ligera, sin numeración de features y con un change por historia en `openspec/changes/` |
| Lenguaje | TypeScript (monorepo) | Un solo lenguaje y tipos compartidos entre front y back |
| Frontend | React + Vite + Tailwind + Recharts | Rápido de generar; las gráficas de sensores salen casi gratis |
| Backend | Hono + Zod | Validación de toda entrada, que cuenta como control de seguridad |
| Base de datos | Postgres (Render Postgres en el despliegue, Docker en local) | SQL normal para el histórico y los filtros |
| Autenticación | JWT propio con roles `admin` y `tecnico` | Cumple "login con roles" y funciona igual en local y desplegado |
| Contenedor | Un solo contenedor (API + estáticos) | `docker compose up` con datos semilla |
| Despliegue | Render: servicio web y base de datos Postgres | URL pública y toda la infraestructura definida en un solo archivo, `render.yaml` |
| CI/CD | GitHub Actions | Lint, pruebas, seguridad y despliegue por webhook |
| Pruebas | Vitest + Supertest + 2 smoke de Playwright | Cobertura suficiente sin consumir días |
| Seguridad | gitleaks, `npm audit`, CodeQL o Semgrep, Dependabot, helmet, rate limit en login | Evidencia automática en el pipeline |

**Decisiones descartadas (y por qué)**

- **Microservicios reales:** añaden despliegue, red y depuración sin aportar nota. Se usa monolito modular.
- **Cognito:** aporta seguridad real pero es una fuente de fallos en 10 días. Un JWT propio basta para la historia de login.
- **Lambda + EventBridge para el simulador:** menos controlable en vivo que un `POST /simulate` y un botón.
- **AWS en general (CDK, SNS, OIDC):** el taller no lo exige y cada servicio suma cuentas, permisos y puntos de fallo. Se descarta; puede añadirse después si sobra tiempo.
- **Fly.io:** según fuentes de 2026, las cuentas nuevas no tienen plan gratuito, solo una prueba de 2 horas de ejecución o 7 días.
- **Railway:** da 5 USD de prueba única y luego 1 USD mensual de crédito, que una app con base de datos agota rápido; el plan de pago parte de 5 USD al mes.
- **Supabase como base externa:** pausa los proyectos gratuitos tras una semana sin actividad, y una base externa añade otra cuenta y otra conexión que configurar.
- **Kiro:** su plan gratuito ofrece pocos créditos mensuales y cada estudiante necesitaría cuota propia.
- **Spec Kit:** es la preferida del enunciado, pero su numeración secuencial de features choca cuando cinco estudiantes trabajan a la vez y su ciclo (constitution, specify, clarify, plan, tasks, analyze, implement) no cabe en 10 minutos. Se elige OpenSpec y no se mezclan herramientas.

**Despliegue en Render (dos servicios en una sola plataforma)**

- Un archivo `render.yaml` describe el servicio web (el contenedor) y la base de datos Postgres, de modo que la infraestructura queda versionada y se recrea con un clic.
- GitHub Actions ejecuta las pruebas y, si pasan, llama al deploy hook de Render para publicar.
- **Servicio web gratuito:** se suspende tras 15 minutos sin tráfico y tarda cerca de un minuto en despertar. Hay 750 horas gratuitas al mes por espacio de trabajo, suficientes para un servicio encendido todo el mes.
- **Postgres gratuito:** 1 GB, una instancia por espacio de trabajo, y vence 30 días después de crearlo (con 14 días de gracia). Si se crea el día 6, dura de sobra hasta la demo del 24 de noviembre; el script `npm run seed` permite recrearlo en minutos.
- **Notificaciones sin servicios externos:** la historia 7 guarda la notificación en una tabla y la muestra en la interfaz. Según resúmenes de terceros, los planes gratuitos de Render bloquean los puertos SMTP, así que un correo real exigiría un servicio de envío por HTTP, que queda fuera del alcance.
- **Demo individual:** cada estudiante trabaja en local con `docker compose`; la URL desplegada solo se necesita en la fase 1.

## 5. Backlog de historias de usuario

Las dos primeras historias crean el proyecto y la infraestructura sobre la que corre el SDD; las cinco historias de clase dependen solo de la línea base y no entre sí.

| # | Historia | Fase | Depende de | Entrega |
| --- | --- | --- | --- | --- |
| 1 | **Proyecto y entorno SDD:** monorepo (`apps/api`, `apps/web`, `contracts/`), `openspec init`, reglas del proyecto en `openspec/config.yaml` y `CLAUDE.md`, subagentes en `.claude/agents/` y puntos de extensión (registro de rutas, paneles y migraciones) | Línea base | – | Repositorio listo para que cualquier historia siga el flujo SDD |
| 2 | **Infraestructura y CI/CD:** `docker compose` con Postgres y datos semilla, `render.yaml` (servicio web y base de datos), pipeline de GitHub Actions con pruebas, gitleaks, `npm audit` y CodeQL, y deploy hook | Línea base | 1 | URL pública con un esqueleto desplegado y pipeline en verde |
| 3 | Login con roles (admin y técnico) | Línea base | 2 | `auth` |
| 4 | CRUD de nodos y sensores, con simulador de lecturas (voltaje, corriente, potencia) | Línea base | 3 | `nodos`, `sensores`, `lecturas`, `POST /simulate` |
| 5 | Dashboard con última lectura, gráfica por sensor y alertas por umbral | Línea base | 4 | Panel del frontend, `alertas` |
| 6 | Aislar nodo: botón de corte en la ficha del nodo (campo `estado` conectado o desconectado) | Clase | Línea base | `nodos` (columna `estado` ya creada en la base) |
| 7 | Notificar a técnicos cuando salta una alerta de umbral (centro de notificaciones en la interfaz) | Clase | Línea base (historia 5) | Módulo `notificaciones` |
| 8 | Usuarios o dispositivos afectados por un nodo | Clase | Línea base | Tabla propia `nodo_usuarios` |
| 9 | Histórico con filtros y exportación a CSV | Clase | Línea base | Lee solo `lecturas` |
| 10 | Registro de mantenimiento y asignación de técnico a un nodo | Clase | Línea base | Tabla propia, lee `nodos` y `usuarios` |

**Cambios frente al borrador anterior:** las historias 1 y 2 pasan a ser habilitadoras (proyecto SDD e infraestructura), porque todo lo demás se construye con ellas y su especificación es la primera evidencia de trazabilidad. Para mantener cinco historias base, el simulador se une al CRUD (historia 4) y las alertas al dashboard (historia 5). Las historias de clase no cambian: la 7 se dispara con cualquier alerta de umbral y la 8 usa una tabla propia, así que ninguna depende de otra.

**Puntos de extensión que debe traer la línea base** (sin ellos, cada estudiante edita `app.ts` y `Menu.tsx` y aparecen los conflictos):

- Registro de rutas por módulo en el backend: cada módulo declara sus rutas en su propia carpeta.
- Registro de paneles y ítems de menú en el frontend.
- Carpeta de migraciones con prefijo por historia, por ejemplo `0006_aislar_nodo.sql`.
- Un change de OpenSpec por historia, con nombre descriptivo y no numérico: `openspec/changes/aislar-nodo/`. Así no hay choques de numeración entre estudiantes.
- Datos semilla con nodos, sensores, usuarios y lecturas para probar cualquier historia desde el primer minuto.

## 6. Arquitectura multiagente (Modalidad B)

La colaboración es real solo si hay trabajo de al menos dos agentes distintos, un rechazo genuino del agente de calidad y la corrección posterior, todo con evidencia en el repositorio.

Los agentes son subagentes de Claude Code definidos en `.claude/agents/*.md` y versionados en el repo. El orquestador es la sesión principal; backend y frontend trabajan en worktrees de git separados y se comunican únicamente a través del contrato `contracts/openapi.yaml`.

| Agente | Responsabilidad | Alcance de herramientas | Rechaza cuando |
| --- | --- | --- | --- |
| Orquestador (sesión principal) | Reparte tareas, coordina y fusiona | Todas | Falta la propuesta del change o sus tareas están incompletas |
| `spec-analyst` | Ejecuta `/opsx:explore` y `/opsx:propose`; revisa la propuesta contra las reglas del proyecto | Lectura y escritura solo en `openspec/` | La especificación es ambigua o no tiene criterios de aceptación |
| `backend-dev` | API y migraciones | Edición y shell en `apps/api` | El cambio no cumple el contrato OpenAPI |
| `frontend-dev` | Interfaz | Edición y shell en `apps/web` | La UI consume campos fuera del contrato |
| `qa-security` | Pruebas y escaneos de seguridad | Lectura y ejecución de pruebas, sin editar código | Falla una prueba, hay un secreto expuesto o `npm audit` marca nivel alto |

**Flujo por historia**

1. `spec-analyst` ejecuta `/opsx:propose`, que genera proposal, specs, design y tasks; el design incluye el contrato OpenAPI del módulo.
2. `backend-dev` y `frontend-dev` implementan en paralelo, cada uno en su worktree y con un PR propio.
3. `qa-security` ejecuta pruebas y escaneos. Si rechaza, el trabajo vuelve al agente que corresponda y se repite este paso.
4. El orquestador fusiona los PR, ejecuta `/opsx:archive` y la integración continua despliega.

**Evidencia exigible**

- Un PR por agente, con commits identificables.
- `AGENTS_LOG.md` con qué hizo cada agente y qué rechazó `qa-security`.
- Al menos un rechazo real de QA con su corrección posterior.
- Contrato OpenAPI generado en la fase de diseño y respetado por ambos lados.

## 7. Flujo SDD y demostración individual

Con OpenSpec el flujo completo cabe en la demo de 5 a 10 minutos: son tres comandos y cada historia queda trazada en su propia carpeta `openspec/changes/<nombre>/`.

**Flujo OpenSpec (línea base y demo)**

1. `openspec init` (una sola vez, en la HU 1): crea la carpeta `openspec/` e instala los comandos en Claude Code.
2. `/opsx:explore` (opcional): aclarar la idea con la IA antes de proponer.
3. `/opsx:propose <nombre>`: genera `proposal.md`, `specs/` (deltas de requisitos), `design.md` y `tasks.md`. Se revisa antes de seguir.
4. `/opsx:apply`: implementa las tareas y marca el checklist de `tasks.md`.
5. `/opsx:archive`: fusiona los deltas en `openspec/specs/` y mueve el change a `openspec/changes/archive/`.

**En la demo individual:** `propose` → revisar la propuesta → `apply` → pruebas. El `archive` lo hace el orquestador después de fusionar el PR, uno a la vez, para que los deltas de varios estudiantes no choquen. La trazabilidad se conserva con la carpeta del change y con commits y PR que citen su nombre.

**Preparación de la demo individual**

- Un prompt-plantilla de una línea por historia, ya escrito y probado.
- `docker compose up` verificado en el portátil de cada integrante, no solo en el de quien lo preparó.
- Cuenta de IA propia por estudiante, con reserva de cuota, y una rama con cada historia ya resuelta como respaldo.
- Dependencias e imágenes de Docker descargadas de antemano por si falla la red.
- Un ensayo cronometrado por integrante con una historia de práctica el día 8.

**Nota de versión:** desde OpenSpec 1.0 los comandos son `/opsx:*`; los antiguos `/openspec:proposal`, `/openspec:apply` y `/openspec:archive` ya no existen. El perfil por defecto trae `propose`, `explore`, `apply` y `archive`; los adicionales (`new`, `ff`, `verify`, entre otros) se activan con `openspec config profile` y `openspec update`. La instalación por npm requiere Node 20.19 o superior. Confirmar con `openspec --version` el día 1.

## 8. Reglas del proyecto (esbozo)

OpenSpec no tiene un comando de constitución: estas reglas se guardan como contexto del proyecto en `openspec/config.yaml` y en `CLAUDE.md`, para que cada propuesta las respete y no discuta tecnología.

- **Stack fijo:** TypeScript, React + Vite, Hono + Zod, Postgres. No se añaden librerías sin aprobación del equipo.
- **Estructura:** monorepo con `apps/api`, `apps/web`, `contracts/` y `openspec/`.
- **Trazabilidad:** cada historia es un change en `openspec/changes/<nombre>/` con proposal, specs, design y tasks; los commits y PR citan el nombre del change.
- **Validación:** toda entrada pasa por Zod; ninguna ruta confía en datos del cliente.
- **Pruebas:** las pruebas de aceptación de la historia deben pasar antes de fusionar.
- **Extensión:** rutas y paneles nuevos solo mediante los registros de extensión; no se edita el núcleo.
- **Datos:** migraciones con prefijo por historia; ninguna historia modifica tablas ajenas.
- **Seguridad:** nunca secretos en el repositorio; variables de entorno del proveedor; roles verificados en el backend.
- **Agentes:** cada agente trabaja solo en su alcance; `qa-security` puede rechazar y su rechazo se registra en `AGENTS_LOG.md`.

## 9. Cronograma de 10 días

La URL pública debe existir el día 6 y el día 8 se dedica a ensayar la demo individual en portátiles ajenos; ninguna funcionalidad nueva entra después del día 7.

| Día | Entregable | Hito de verificación |
| --- | --- | --- |
| 1 | Historia 1 (proyecto y entorno SDD) e inicio de la historia 2: repositorio, `openspec init`, reglas del proyecto, agentes y `docker compose` | `docker compose up` funciona en una máquina limpia; se confirma `openspec --version` |
| 2-3 | Especificaciones de la línea base y esqueleto con puntos de extensión | Las historias 1 a 5 tienen su change en OpenSpec (proposal, specs, design y tasks) |
| 4-6 | Implementación de las historias 3 a 5 con pruebas | Login, CRUD y simulador funcionan en local |
| 6 | Cierre de la historia 2: despliegue en Render y CI | URL pública estable y pipeline en verde |
| 7 | Controles de seguridad, evidencias y specs de las historias 6 a 10 (sin implementarlas) | Reportes de gitleaks, audit y CodeQL guardados |
| 8 | Ensayo individual cronometrado | Cada integrante entrega una historia de práctica en menos de 10 minutos, en su portátil |
| 9 | Documentación y matriz de trazabilidad | Instrucciones de instalación probadas desde cero |
| 10 | Colchón y ensayo de la demo | Sin funcionalidades nuevas; rama de respaldo lista |

## 10. Evidencias por criterio de rúbrica

Cada criterio de la rúbrica tiene evidencias concretas que se guardan en el repositorio a medida que se producen, no al final.

| Criterio | Evidencias |
| --- | --- |
| Producto funcional (30 %) | URL desplegada y viva, guion de smoke, `docker compose up` probado, datos semilla, pruebas automatizadas en verde |
| Aplicación de SDD (30 %) | Un change de OpenSpec por historia (activo o archivado), `openspec/specs/` actualizado, matriz de trazabilidad requisito → prueba → commit, reglas del proyecto |
| Demostración individual (40 %) | Prompt-plantilla por historia, ensayo cronometrado por integrante, rama de respaldo, plan de contingencia (video o rama lista) |
| Seguridad | Reportes de gitleaks, `npm audit` y CodeQL o Semgrep, más una nota de controles aplicados |
| Multiagente | PR por agente, `AGENTS_LOG.md`, un rechazo real de QA documentado con su corrección |
| Entrega | Repositorio, backlog, instrucciones de instalación y ejecución, enlace desplegado, descripción de la arquitectura multiagente |

## 11. Riesgos y mitigaciones

Los dos riesgos con mayor probabilidad de afectar la nota son que la demo individual falle en un portátil concreto y que el despliegue consuma días.

| Riesgo | Mitigación |
| --- | --- |
| Cuota de IA agotada durante la demo individual | Cuenta propia por estudiante con reserva de cuota y una rama de respaldo con la historia ya resuelta |
| `docker compose` falla en algún portátil | Ensayar en máquinas ajenas el día 8, documentar requisitos y tener devcontainer o Codespaces como alternativa |
| Wi-Fi caído en el salón | Dependencias e imágenes ya descargadas, `npm ci` en caché y modo local que no necesite la URL desplegada |
| Conflictos entre historias desarrolladas en paralelo | Puntos de extensión en la línea base, un archivo y una migración por historia y reglas de nombres en las reglas del proyecto |
| El despliegue consume demasiados días | Todo definido en `render.yaml`; si el día 6 no hay URL pública, se despliega a mano desde el panel de Render sin discusión |
| Servicio web gratuito dormido (cerca de 1 minuto de espera) o base de datos gratuita vencida (30 días) | Abrir la app 5 minutos antes de presentar, ping opcional cada 10 minutos y `npm run seed` para recrear la base en minutos |
| La multiagencia resulta ser teatro | Un PR por agente, `AGENTS_LOG.md` y al menos un rechazo real de QA con su corrección |

## 12. Puntos por verificar y fuentes

Tres datos no pudieron confirmarse y deben revisarse el día 1 antes de construir sobre ellos.

- **Comandos de OpenSpec en Claude Code:** la documentación usa `/opsx:propose` como nombre canónico, pero no muestra una forma específica para Claude Code. Verificarlo tras `openspec init`, y probar si `/opsx:verify` (perfil extendido) sirve como paso de validación antes del PR.
- **`isolation: worktree` en subagentes:** solo se halló en una guía de terceros. Verificarlo en la documentación oficial de Claude Code.
- **Límites gratuitos de Render:** la suspensión a los 15 minutos, el vencimiento de la base a los 30 días y las 750 horas mensuales provienen de la documentación de Render y de reseñas de terceros de 2026. Confirmarlos en render.com/pricing antes del día 6, porque Render ha recortado límites gratuitos varias veces.

Los datos de herramientas proceden de consultas hechas el 14 y el 17 de noviembre de 2026.

**Fuentes**

- [OpenSpec en GitHub (Fission-AI)](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec: cómo funcionan los comandos](https://openspec.dev/docs/how-commands-work)
- [OpenSpec 1.0: cambios de comandos](https://newreleases.io/project/github/Fission-AI/OpenSpec/release/v1.0.0)
- [Spec Kit vs BMAD vs OpenSpec en 2026](https://dev.to/willtorber/spec-kit-vs-bmad-vs-openspec-choosing-an-sdd-framework-in-2026-d3j)
- [Reseña de Kiro](https://dev.to/pickuma/amazon-kiro-review-awss-spec-driven-agentic-ide-in-2026-4f48)
- [Guía de subagentes de Claude Code](https://alexcloudstar.com/md/blog/claude-code-subagents-guide-2026/)
- [Render: despliegue gratuito (documentación oficial)](https://render.com/docs/free)
- [Render: precios 2026 (reseña de terceros)](https://temps.sh/blog/render-pricing-2026)
- [Fly.io: precios 2026, sin plan gratuito para cuentas nuevas (terceros)](https://temps.sh/blog/fly-io-pricing-2026)
- [Railway: plan gratuito 2026 (terceros)](https://kuberns.com/blogs/railway-free-tier/)
- [Supabase: pausa de proyectos gratuitos (oficial)](https://supabase.com/kb/faqs/platform/free-project-pausing)
