-- Notificaciones de demostración de la HU 7 (#24) para la cuenta `tecnico` de la HU 3: tres sin leer y dos leídas.
-- Idempotente: ids fijos y ON CONFLICT DO NOTHING; las fechas son relativas al momento de la primera carga.
INSERT INTO notificaciones (id, destinatario_id, sensor, magnitud, valor, creada_en, leida)
SELECT n.id::uuid, u.id, n.sensor, n.magnitud, n.valor, now() - n.antiguedad, n.leida
FROM usuarios u
CROSS JOIN (VALUES
    ('7a1c0001-0000-4000-8000-000000000001', 'Transformador principal', 'voltaje', 131.5, interval '5 minutes', false),
    ('7a1c0001-0000-4000-8000-000000000002', 'Transformador principal', 'corriente', 12.8, interval '30 minutes', false),
    ('7a1c0001-0000-4000-8000-000000000003', 'Transformador principal', 'potencia', 1650, interval '2 hours', false),
    ('7a1c0001-0000-4000-8000-000000000004', 'Transformador principal', 'voltaje', 128.2, interval '1 day', true),
    ('7a1c0001-0000-4000-8000-000000000005', 'Transformador principal', 'corriente', 11.4, interval '2 days', true)
) AS n (id, sensor, magnitud, valor, antiguedad, leida)
WHERE u.nombre_usuario = 'tecnico'
ON CONFLICT (id) DO NOTHING;
