-- Sensores de demostración de la HU 4 (#21), sobre los nodos de db/seed/nodos.sql (que se aplica antes,
-- por orden alfabético). Idempotente: aplicar la semilla otra vez no duplica nada.
INSERT INTO sensores (id, nodo_id, nombre, umbral_voltaje, umbral_corriente, umbral_potencia) VALUES
    ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Transformador principal', 125, 15, 1800),
    ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Línea de respaldo', 128, 18, NULL),
    ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002', 'Alimentador residencial', 125, 12, 1400)
ON CONFLICT (id) DO NOTHING;

-- Una lectura por sensor. Van aquí y no en lecturas.sql, que se aplicaría antes que los nodos (decisión #17).
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia) VALUES
    ('00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000000101', 120.4, 9.8, 1179.92),
    ('00000000-0000-4000-8000-000000001102', '00000000-0000-4000-8000-000000000102', 118.7, 6.2, 735.94),
    ('00000000-0000-4000-8000-000000001201', '00000000-0000-4000-8000-000000000201', 121.9, 7.5, 914.25)
ON CONFLICT (id) DO NOTHING;
