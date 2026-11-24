-- Datos de demostración de la HU 9 (#26) para el histórico y su prueba e2e. Idempotente: aplicarla otra vez no duplica nada.
-- Todas las lecturas son de marzo de 2026 (y dos, justo fuera del rango), para que el simulador continuo, que escribe con la
-- fecha actual, no las mezcle con un filtro de marzo. Nodo 1: 26 lecturas dentro del rango (24 del sensor A y 2 del B) y 2 fuera.
-- Nodo 2: 3 lecturas dentro del rango, que sirven de distractor por nodo.
INSERT INTO nodos (id, nombre, ubicacion) VALUES
    ('00000000-0000-4000-8000-000000000301', 'Histórico nodo uno', 'Medellín, Antioquia'),
    ('00000000-0000-4000-8000-000000000302', 'Histórico nodo dos', 'Envigado, Antioquia')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sensores (id, nodo_id, nombre) VALUES
    ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000301', 'Histórico sensor A'),
    ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000301', 'Histórico sensor B'),
    ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000302', 'Histórico sensor C')
ON CONFLICT (id) DO NOTHING;

-- Sensor A: 24 lecturas dentro del rango, una por hora desde el 2026-03-10 10:00 UTC.
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia, tomada_en)
SELECT format('00000000-0000-4000-8000-%s', lpad((3000 + n)::text, 12, '0'))::uuid,
       '00000000-0000-4000-8000-000000000311', 110 + n, 5 + n / 10.0, (110 + n) * (5 + n / 10.0),
       timestamptz '2026-03-10 10:00:00+00' + make_interval(hours => n)
FROM generate_series(1, 24) AS n
ON CONFLICT (id) DO NOTHING;

-- Sensor B: 2 lecturas dentro del rango, una por día desde el 2026-03-15 08:00 UTC.
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia, tomada_en)
SELECT format('00000000-0000-4000-8000-%s', lpad((3100 + n)::text, 12, '0'))::uuid,
       '00000000-0000-4000-8000-000000000312', 120 + n, 8, (120 + n) * 8,
       timestamptz '2026-03-15 08:00:00+00' + make_interval(days => n)
FROM generate_series(0, 1) AS n
ON CONFLICT (id) DO NOTHING;

-- Distractores por fecha: el sensor A, un minuto antes y un minuto después del rango de marzo.
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
    ('00000000-0000-4000-8000-000000003201', '00000000-0000-4000-8000-000000000311', 119, 6, 714, '2026-02-28 23:59:00+00'),
    ('00000000-0000-4000-8000-000000003202', '00000000-0000-4000-8000-000000000311', 121, 6, 726, '2026-04-01 00:01:00+00')
ON CONFLICT (id) DO NOTHING;

-- Distractores por nodo: el sensor C, dentro del rango.
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia, tomada_en)
SELECT format('00000000-0000-4000-8000-%s', lpad((3300 + n)::text, 12, '0'))::uuid,
       '00000000-0000-4000-8000-000000000321', 115 + n, 7, (115 + n) * 7,
       timestamptz '2026-03-12 12:00:00+00' + make_interval(hours => n)
FROM generate_series(1, 3) AS n
ON CONFLICT (id) DO NOTHING;
