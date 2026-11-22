# Verificación

## Build

`node .claude/skills/build-test/scripts/build-test.mjs 20` (con `DATABASE_URL` de la base de desarrollo de docker compose): **BUILD SUCCESS** (typecheck, `test:unit` con 75 pruebas y `test:integration` con 38). Además, `npm run lint`, `npm run build` y `openspec validate --all --strict` en verde. Log: `.flujo/issue-20/build-20261122-143744.log`.

## Revisor de reglas

Veredicto: 0 CRITICAL, 2 WARNING, 2 SUGGESTION. Sin CRITICAL ni fallo de build por código, no corre el paso 7 (corregir).

| # | Severidad | Archivo | Hallazgo | Estado |
|---|---|---|---|---|
| 1 | WARNING | `src/app/api/auth/login/route.ts` (`ipDe`) | Sin `x-forwarded-for`, todas las peticiones comparten la clave `ip:desconocida`: cinco fallos de cualquiera bloquean el login de todos durante un minuto. Confirmado leyendo el código. Render siempre envía la cabecera, así que afecta a quien ejecute la app sin proxy. | Abierto: se informa en el PR; queda para decisión de la persona |
| 2 | WARNING | `src/modulos/auth/limitador.ts` (`podar`) | Cada fallo recorre y reconstruye todo el mapa: con muchos usuarios distintos dentro de la ventana el coste por intento crece (O(n)). Confirmado. El tamaño queda acotado por los intentos de un minuto. | Abierto: se informa en el PR |
| 3 | SUGGESTION | `src/modulos/auth/limitador.ts` (`tamano`) | Solo la usa la prueba de poda. | Abierto: se informa en el PR |
| 4 | SUGGESTION | `src/modulos/auth/service.ts` (`iniciarSesion`) | Hay un `await` entre comprobar el límite y registrar el fallo: peticiones concurrentes pueden pasar de 5 intentos antes de que el primer fallo se registre. | Abierto: margen aceptado por el diseño en memoria (decisión #4); se informa en el PR |

## Pruebas

Pruebas: 7 de 7 CA con prueba
