# Reglas de negocio de las historias construidas

Copiadas del issue de cada historia (`evidencias/issue-<n>/issue.md`). Las reglas `RN-n`, lo que cada historia dejó fuera de alcance y las decisiones de la persona siguen vigentes; los números de decisión son los de ese issue.

<!-- entrada: issue 2 -->
## #2 Como equipo de desarrollo quiero un proyecto base con la estructura, las herramientas de calidad, la observabilidad y los puntos de extensió

Reglas de negocio:
- **RN-1:** El stack es fijo (propuesta, sección 8): TypeScript, Next.js 16 App Router, Route Handlers + Zod, `pg`, Tailwind, Recharts, `jose`, `pino` y `prom-client`. No se usan Server Actions ni un ORM con migraciones propias.
- **RN-2:** Los logs nunca incluyen contraseñas, tokens ni cuerpos de petición. No se usa `console.log` suelto.
- **RN-3:** Las rutas, el menú, los paneles de la ficha del nodo y los suscriptores de alertas solo se extienden mediante los registros (`menu.ts`, `paneles.ts`, `on-alerta.ts`). `proxy.ts`, `src/lib/` y el layout del tablero son núcleo.
- **RN-4:** Ningún secreto en el repositorio: `.env.example` lleva solo nombres de variables (`DATABASE_URL`, `SESSION_SECRET`, `METRICS_TOKEN`, credenciales de Postgres y Flyway), sin valores reales.
Fuera de alcance:
- OpenSpec, `CLAUDE.md`, `.claude/settings.json`, agentes y skills (HU 1a).
- Dockerfile, `docker compose`, Flyway, la migración de línea base, la semilla y CI/CD (HU 2).
- Las tablas de dominio, el login y la página de login (HU 3). Aquí solo va el núcleo de sesión (`session.ts`, `dal.ts`).
<!-- fin -->

<!-- entrada: issue 20 -->
## #20 HU 3: Iniciar sesión con roles de administrador y técnico

Reglas de negocio:
- **RN-1:** Los roles son `administrador` y `tecnico` (propuesta, sección 4; son los literales de `ROLES` en `src/lib/session.ts`). Cada usuario tiene exactamente uno.
- **RN-2:** La contraseña nunca se guarda ni se registra en claro; el log no incluye contraseñas ni tokens.
- **RN-3:** La sesión es un JWT firmado con `SESSION_SECRET` y se verifica siempre en el servidor.
- **RN-4:** El usuario inicia sesión con su nombre de usuario, que es único.
- **RN-5:** La contraseña se guarda con `scrypt` del módulo `crypto` de Node (sal aleatoria por usuario) y se compara en tiempo constante. No se agrega ninguna librería.
- **RN-6:** El límite de login es de 5 intentos fallidos por minuto, contados por IP y por usuario; al superarlo responde 429 (CA-4).
- **RN-7:** La sesión dura 8 horas, valor que ya fija `DURACION_SESION_S` en el núcleo; esta historia no lo cambia.
Fuera de alcance:
- Registro de usuarios, recuperación de contraseña y administración de usuarios.
- Cierre de sesión por inactividad y renovación del token.
- Proveedores externos de identidad (se descartó Cognito).
Decisiones de la persona:
- #20 decisión 2: Contraseñas con `scrypt` de Node, sal aleatoria por usuario y `timingSafeEqual`, sin librerías nuevas.
- #20 decisión 6: La sesión dura 8 horas: la fija el núcleo y la historia no la cambia.
<!-- fin -->

<!-- entrada: issue 21 -->
## #21 HU 4: Administrar nodos y sensores con simulador de lecturas

Reglas de negocio:
- **RN-1:** Las magnitudes simuladas son voltaje, corriente y potencia (propuesta, sección 1).
- **RN-2:** El estado de un nodo es "conectado" o "desconectado"; la columna existe desde esta historia para que la HU 6 solo la cambie.
- **RN-3:** Toda entrada pasa por Zod y el rol se verifica en cada handler.
Fuera de alcance:
- Cambiar el estado del nodo desde la interfaz (HU 6).
- Alertas por umbral y gráficas (HU 5).
- Histórico con filtros y exportación (HU 9).
Decisiones de la persona:
- #21 decisión 1: Campos: nodo con nombre, ubicación y estado; sensor con nombre y umbrales (sin "tipo", porque cada sensor mide las tres magnitudes)
- #21 decisión 2: Cada lectura trae voltaje, corriente y potencia (CA-6)
- #21 decisión 3: Umbrales de la HU 5: un umbral máximo por magnitud en el sensor (tres columnas opcionales)
- #21 decisión 4: El simulador genera valores aleatorios en un rango razonable por magnitud, con alguna lectura fuera del umbral de vez en cuando
- #21 decisión 5: Eliminar un nodo elimina en cascada sus sensores y lecturas (y eliminar un sensor, sus lecturas)
- #21 decisión 6: El técnico solo consulta (CA-5)
- #21 decisión 7: El simulador solo corre por botón y por API; sin temporizador
- #21 decisión 8: Dato inválido (CA-3): nombre obligatorio con longitud máxima; ubicación opcional; sin unicidad de nombre
- #21 decisión 9: El simulador sobre un nodo sin sensores responde 200 con cero lecturas (CA-6)
- #21 decisión 10: El simulador actúa sobre el nodo indicado en el cuerpo, que es obligatorio (CA-6)
<!-- fin -->

<!-- entrada: issue 22 -->
## #22 HU 5: Ver el dashboard con lecturas, gráficas y alertas por umbral

Reglas de negocio:
- **RN-1:** Una lectura genera alerta solo si supera el umbral de su sensor (propuesta, sección 3). Cada sensor tiene un umbral máximo opcional por magnitud y no hay umbral mínimo (decisiones 2 y 3 de la HU 4, #21). La comparación es por magnitud: una lectura que supera el umbral en dos magnitudes genera dos alertas.
- **RN-2:** El servicio de alertas no conoce a sus suscriptores: los descubre por `src/nav/registro.ts`.
- **RN-3:** Hay una sola severidad: toda alerta vale lo mismo.
- **RN-4:** Se crea una alerta por cada lectura que supera el umbral, no solo al cruzarlo. Las alertas no tienen estado: no se marcan como atendidas.
- **RN-5:** La gráfica de un sensor es un panel con tres trazos pequeños, uno por magnitud y cada uno con su propio eje, sin selector ni otra interacción. Muestra las 50 lecturas más recientes.
- **RN-6:** El servicio avisa a los suscriptores después de guardar la alerta y les entrega su identificador, el sensor, la magnitud, el valor, el umbral y la fecha. El fallo de un suscriptor no impide guardar la alerta ni avisar a los demás.
Fuera de alcance:
- Notificar a los técnicos (HU 7).
- Editar los umbrales desde el dashboard (se definen al administrar sensores, HU 4).
- Actualización en tiempo real por WebSocket.
- Niveles de severidad y marcar alertas como atendidas.
- Selector de magnitud u otra interacción en las gráficas.
Decisiones de la persona:
- #22 decisión 1: CA-4: el dashboard lista las últimas 20 alertas, la más reciente primero
- #22 decisión 2: CA-7: `GET /api/lecturas` y `GET /api/alertas` aceptan `sensorId` (UUID, opcional) y `limite` (entero de 1 a 100, opcional); cualquier otro valor de esos parámetros responde 400 por Zod
- #22 decisión 3: CA-1: la fecha se muestra en formato local legible es-CO y las unidades son V, A y W
<!-- fin -->

<!-- entrada: issue 23 -->
## #23 HU 6: Aislar un nodo de la red

Reglas de negocio:
- **RN-1:** Los únicos estados son "conectado" y "desconectado" (propuesta, fila 6).
- **RN-2:** Aislar y reconectar piden confirmación antes de cambiar el estado (CA-1 y CA-2).
- **RN-3:** Aislar un nodo solo cambia su estado visible: el simulador no se modifica y un nodo desconectado sigue recibiendo lecturas si se simula.
- **RN-4:** No se registra quién ni cuándo cambió el estado.
- **RN-5:** Esta historia actualiza únicamente la columna `estado` de `nodos`, que la HU 4 creó para ella (propuesta, fila 6). Es la única excepción a la regla de no modificar tablas ajenas: no hay migración ni se tocan otras columnas.
Fuera de alcance:
- Aislar varios nodos a la vez.
- Notificar a los técnicos del cambio (lo cubre la HU 7 solo para alertas de umbral).
- Operar equipos reales o implementar dependencias de HU 3/HU 4 en este borrador.
- Que el simulador omita los nodos desconectados.
- Auditoría de los cambios de estado.
Decisiones de la persona:
- #23 decisión 1: CA-1/CA-2: si el destino pedido ya es el estado actual del nodo, la API responde 200 con el estado actual y no cambia nada (idempotente)
<!-- fin -->
