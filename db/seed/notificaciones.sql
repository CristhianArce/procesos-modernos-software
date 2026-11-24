-- Notificaciones de demostración de la HU 7 (#24) para la cuenta `tecnico` de db/seed/auth.sql.
-- Idempotente: los identificadores son fijos y aplicar la semilla otra vez no duplica nada.
-- Tres sin leer y una leída, con fechas fijas y distintas para que el orden sea reproducible.
INSERT INTO notificaciones (id, usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
SELECT n.id::uuid, u.id, n.sensor_nombre, n.magnitud, n.valor, n.alerta_creada_en::timestamptz, n.leida
FROM usuarios u
CROSS JOIN (VALUES
    ('00000000-0000-4000-8000-000000002401', 'Sensor de tensión S1', 'voltaje', 131.4, '2026-11-20 08:00:00+00', true),
    ('00000000-0000-4000-8000-000000002402', 'Sensor de corriente S2', 'corriente', 17.2, '2026-11-20 09:30:00+00', false),
    ('00000000-0000-4000-8000-000000002403', 'Sensor de potencia S3', 'potencia', 2150, '2026-11-20 11:00:00+00', false),
    ('00000000-0000-4000-8000-000000002404', 'Sensor de tensión S1', 'voltaje', 128.9, '2026-11-20 12:15:00+00', false)
) AS n (id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
WHERE u.nombre_usuario = 'tecnico'
ON CONFLICT (id) DO NOTHING;
