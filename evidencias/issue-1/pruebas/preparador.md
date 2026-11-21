# Prueba del agente preparador (tareas 5.2 y 5.3; CA-6, CA-7)

- **Fecha:** 2026-11-21. Sesiones nuevas `claude -p --model sonnet`, que lanzan el subagente `preparador` (sonnet / medium) con el issue de prueba #6.
- **Base:** `feature/issue-1-configuracion-ia-sdd`, porque `main` todavía no tiene los agentes.

| Corrida | Situación | Esperado | Obtenido | Tiempo | Cumple |
|---|---|---|---|---|---|
| 1 | #6 abierto, sin rama | Crea `feature/issue-6-pagina-acerca-de` y `.flujo/issue-6/` con CA-1 a CA-3 | OK: rama creada, 4 archivos, CA copiados literales | 50 s | Sí |
| 2 | Misma situación, segunda vez | Reutiliza la rama y los archivos | OK: todo reutilizado; `issue.md` sin cambios (mismo md5) | 34 s | Sí |
| 3 | #6 cerrado con `gh issue close` | `BLOQUEAR: ya resuelto` sin crear nada | `BLOQUEAR: ya resuelto`; sin rama ni `.flujo/issue-6/`; el #6 se reabrió después | 23 s | Sí |

**Mejora encontrada en la corrida 1:** con `git switch -c <rama> origin/<base>`, la rama quedaba siguiendo a la base, y un `git push` sin destino habría ido a la rama del issue #1. Se agregó `--no-track` al agente.

## Salida textual: corrida 1

Resultado: OK
Raíz: C:/Users/Lenovo/Documents/EAFIT/MATERIAS/Procesos_Modernos_Del_Software/procesos-modernos-software
Rama: feature/issue-6-pagina-acerca-de (creada, desde origin/feature/issue-1-configuracion-ia-sdd)
Archivos (creados, en `.flujo/issue-6/`):
- issue.md
- preguntas.md
- decisiones.md
- agentes-log.md

Criterios: CA-1 … CA-3 (copiados literales del issue)
Preguntas abiertas: ninguna. El issue dice "Ninguna" y no encontré lagunas.

Notas:
- El issue está abierto y no hay ningún PR abierto que lo resuelva.
- La rama nueva quedó con upstream `origin/feature/issue-1-configuracion-ia-sdd`, porque usé esa rama como base. Antes de hacer push hay que fijar el upstream correcto (`git push -u origin feature/issue-6-pagina-acerca-de`). Si no, un `git push` sin argumentos iría a la rama del issue #1.

## Salida textual: corrida 2

 Segunda corrida: todo existe y se reutiliza.
  
  ```
  Resultado: OK
  Raíz: C:\Users\Lenovo\Documents\EAFIT\MATERIAS\Procesos_Modernos_Del_Software\procesos-modernos-software
  Rama: feature/issue-6-pagina-acerca-de (reutilizada; ya era la rama actual, no se cambió de rama)
  Archivos (todos reutilizados, en C:\Users\Lenovo\Documents\EAFIT\MATERIAS\Procesos_Modernos_Del_Software\procesos-modernos-software\.flujo\issue-6\):
    - issue.md
    - preguntas.md
    - decisiones.md
    - agentes-log.md
  Criterios: CA-1 … CA-3 (según el issue; no verifiqué que issue.md los contenga)
  Preguntas abiertas: ninguna en el issue (no revisé preguntas.md)
  ```
  
  Notas:
  - El issue #6 está OPEN y no hay PR abierto que lo resuelva.
  - Existen `openspec/config.yaml` y el skill `openspec-propose`.
  - El árbol de trabajo estaba limpio.
  - La base que me diste es `feature/issue-1-configuracion-ia-sdd`. No creé la rama desde ella porque ya existía, y no comprobé si está basada en esa rama.

## Salida textual: corrida 3 (issue cerrado)

   Resultado: BLOQUEAR: ya resuelto
    
    El issue #6 tiene estado `CLOSED`, así que no creé nada. No cambié de rama, no creé `.flujo/issue-6/` y no modifiqué el issue.
    
    El PR abierto no llegó a ser un motivo: la búsqueda `in:body "#6"` no devolvió ninguno. El issue es de prueba y su descripción dice que se puede cerrar y reabrir. Si quieres continuar, reábrelo y vuelve a lanzarme.

## issue.md generado en la corrida 1 (final)

```
## Criterios numerados

- **CA-1:** Dado un usuario autenticado (administrador o técnico), cuando consulta `GET /api/acerca`, entonces recibe 200 con un JSON que contiene `nombre` y `version`.
- **CA-2:** Dado un técnico autenticado, cuando abre el tablero, entonces ve el ítem "Acerca de" en el menú, y al entrar a `/acerca` ve el nombre y la versión de la app.
- **CA-3:** Dado un visitante sin sesión, cuando consulta `GET /api/acerca`, entonces recibe 401 con un JSON de error.
```
