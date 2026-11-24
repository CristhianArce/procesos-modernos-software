-- Histórico de lecturas de la HU 9 (#26): datos de fechas fijas para las pruebas e2e (decisión #6).
-- Autocontenida: crea su propio nodo y sus sensores, así que no depende de que nodos.sql corra antes
-- (scripts/seed.mjs aplica las semillas en orden alfabético). Idempotente: ids fijos y ON CONFLICT DO NOTHING.
INSERT INTO nodos (id, nombre, ubicacion) VALUES
    ('00000000-0000-4000-8000-000000000901', 'Nodo histórico demo', 'Laboratorio de datos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sensores (id, nodo_id, nombre) VALUES
    ('00000000-0000-4000-8000-000000000911', '00000000-0000-4000-8000-000000000901', 'Medidor histórico A'),
    ('00000000-0000-4000-8000-000000000912', '00000000-0000-4000-8000-000000000901', 'Medidor histórico B')
ON CONFLICT (id) DO NOTHING;

-- Sensor A: 26 lecturas dentro de 2026-01-10 a 2026-01-12 (hora de Bogotá), cada 2 horas desde el 10 a las 08:00.
-- Con el filtro nodo + sensor A + ese rango quedan 25 en la página 1 y 1 en la página 2.
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia, tomada_en)
SELECT format('00000000-0000-4000-8000-0000000090%s', lpad(n::text, 2, '0'))::uuid,
       '00000000-0000-4000-8000-000000000911', 120 + n / 10.0, 5, 600,
       timestamptz '2026-01-10 08:00:00-05' + (n - 1) * interval '2 hours'
FROM generate_series(1, 26) AS n
ON CONFLICT (id) DO NOTHING;

-- Distractores: el sensor B en el mismo rango y el sensor A fuera del rango. La de las 23:30 del 9 de enero
-- en Bogotá ya es 10 de enero en UTC: prueba que el día se interpreta en la hora de Bogotá (decisión #3).
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
    ('00000000-0000-4000-8000-000000009031', '00000000-0000-4000-8000-000000000912', 119, 4, 476, '2026-01-11 09:00:00-05'),
    ('00000000-0000-4000-8000-000000009032', '00000000-0000-4000-8000-000000000912', 119.5, 4.1, 490, '2026-01-11 10:00:00-05'),
    ('00000000-0000-4000-8000-000000009041', '00000000-0000-4000-8000-000000000911', 121, 5, 605, '2026-01-09 23:30:00-05'),
    ('00000000-0000-4000-8000-000000009042', '00000000-0000-4000-8000-000000000911', 121, 5, 605, '2026-01-13 00:30:00-05')
ON CONFLICT (id) DO NOTHING;
