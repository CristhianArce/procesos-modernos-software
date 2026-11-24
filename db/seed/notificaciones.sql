-- Notificaciones de demostración de la HU 7 (#24) para la cuenta `tecnico` de db/seed/auth.sql (que se aplica antes,
-- por orden alfabético). Dos leídas y dos sin leer, con fechas distintas. Idempotente: ids fijos.
INSERT INTO notificaciones (id, usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
SELECT v.id::uuid, u.id, v.sensor_nombre, v.magnitud, v.valor, v.alerta_creada_en::timestamptz, v.leida
FROM (VALUES
    ('00000000-0000-4000-8000-000000002001', 'Transformador principal', 'voltaje', 131.2, '2026-11-22T15:30:00Z', false),
    ('00000000-0000-4000-8000-000000002002', 'Línea de respaldo', 'corriente', 19.4, '2026-11-22T14:10:00Z', false),
    ('00000000-0000-4000-8000-000000002003', 'Alimentador residencial', 'potencia', 1520, '2026-11-21T22:45:00Z', true),
    ('00000000-0000-4000-8000-000000002004', 'Transformador principal', 'corriente', 16.1, '2026-11-21T09:05:00Z', true)
) AS v (id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
JOIN usuarios u ON u.nombre_usuario = 'tecnico'
ON CONFLICT (id) DO NOTHING;
