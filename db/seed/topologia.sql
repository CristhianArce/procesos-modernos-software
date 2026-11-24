-- Red de demostración del mímico (rediseño SCADA, rama ui/scada). Se aplica después de nodos.sql y sensores.sql
-- (orden alfabético) y reutiliza sus dos subestaciones. Idempotente: identificadores fijos y ON CONFLICT DO NOTHING.
-- Los identificadores nuevos usan 00000000-0000-4000-9000-… para no mezclarse con los de la HU 4 (…-8000-…).

-- Nodos nuevos: 11, que con los 2 de la HU 4 forman una red de 13. Uno queda desconectado para ver ese estado.
INSERT INTO nodos (id, nombre, ubicacion, estado) VALUES
    ('00000000-0000-4000-9000-000000000001', 'Central Hidráulica Oriente', 'Guatapé, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000002', 'Parque Solar Caldas', 'Caldas, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000003', 'Subestación Centro', 'Medellín, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000004', 'Transformador Robledo', 'Medellín, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000005', 'Transformador El Poblado', 'Medellín, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000006', 'Transformador Itagüí', 'Itagüí, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000007', 'Alimentador Residencial Laureles', 'Medellín, Antioquia', 'desconectado'),
    ('00000000-0000-4000-9000-000000000008', 'Alimentador Comercial Centro', 'Medellín, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000009', 'Alimentador Industrial Itagüí', 'Itagüí, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000010', 'Hospital General', 'Medellín, Antioquia', 'conectado'),
    ('00000000-0000-4000-9000-000000000011', 'Planta de Agua La Ayurá', 'Envigado, Antioquia', 'conectado')
ON CONFLICT (id) DO NOTHING;

-- Posición en el lienzo (de izquierda a derecha: generación, subestación, transformador, alimentador, carga).
INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES
    ('00000000-0000-4000-9000-000000000001', 'generacion', 100, 220),
    ('00000000-0000-4000-9000-000000000002', 'generacion', 100, 520),
    ('00000000-0000-4000-8000-000000000001', 'subestacion', 340, 140),
    ('00000000-0000-4000-9000-000000000003', 'subestacion', 340, 350),
    ('00000000-0000-4000-8000-000000000002', 'subestacion', 340, 560),
    ('00000000-0000-4000-9000-000000000004', 'transformador', 600, 140),
    ('00000000-0000-4000-9000-000000000005', 'transformador', 600, 350),
    ('00000000-0000-4000-9000-000000000006', 'transformador', 600, 560),
    ('00000000-0000-4000-9000-000000000007', 'alimentador', 850, 140),
    ('00000000-0000-4000-9000-000000000008', 'alimentador', 850, 350),
    ('00000000-0000-4000-9000-000000000009', 'alimentador', 850, 560),
    ('00000000-0000-4000-9000-000000000010', 'carga', 1090, 300),
    ('00000000-0000-4000-9000-000000000011', 'carga', 1090, 560)
ON CONFLICT (nodo_id) DO NOTHING;

-- Enlaces en el sentido del flujo de energía.
INSERT INTO enlaces (id, origen_id, destino_id) VALUES
    ('00000000-0000-4000-9000-000000000501', '00000000-0000-4000-9000-000000000001', '00000000-0000-4000-8000-000000000001'),
    ('00000000-0000-4000-9000-000000000502', '00000000-0000-4000-9000-000000000001', '00000000-0000-4000-9000-000000000003'),
    ('00000000-0000-4000-9000-000000000503', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-8000-000000000002'),
    ('00000000-0000-4000-9000-000000000504', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-9000-000000000003'),
    ('00000000-0000-4000-9000-000000000505', '00000000-0000-4000-9000-000000000003', '00000000-0000-4000-8000-000000000002'),
    ('00000000-0000-4000-9000-000000000506', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-9000-000000000004'),
    ('00000000-0000-4000-9000-000000000507', '00000000-0000-4000-9000-000000000003', '00000000-0000-4000-9000-000000000005'),
    ('00000000-0000-4000-9000-000000000508', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-9000-000000000006'),
    ('00000000-0000-4000-9000-000000000509', '00000000-0000-4000-9000-000000000004', '00000000-0000-4000-9000-000000000007'),
    ('00000000-0000-4000-9000-000000000510', '00000000-0000-4000-9000-000000000005', '00000000-0000-4000-9000-000000000008'),
    ('00000000-0000-4000-9000-000000000511', '00000000-0000-4000-9000-000000000006', '00000000-0000-4000-9000-000000000009'),
    ('00000000-0000-4000-9000-000000000512', '00000000-0000-4000-9000-000000000008', '00000000-0000-4000-9000-000000000010'),
    ('00000000-0000-4000-9000-000000000513', '00000000-0000-4000-9000-000000000009', '00000000-0000-4000-9000-000000000011')
ON CONFLICT (id) DO NOTHING;

-- Un sensor por nodo nuevo (dos en la central). Umbrales por encima de la operación normal;
-- El Poblado opera cerca del suyo de tensión para que se vea una advertencia.
INSERT INTO sensores (id, nodo_id, nombre, umbral_voltaje, umbral_corriente, umbral_potencia) VALUES
    ('00000000-0000-4000-9000-000000000101', '00000000-0000-4000-9000-000000000001', 'Generador G1', 128, 20, 2600),
    ('00000000-0000-4000-9000-000000000102', '00000000-0000-4000-9000-000000000001', 'Generador G2', 128, 20, 2600),
    ('00000000-0000-4000-9000-000000000201', '00000000-0000-4000-9000-000000000002', 'Inversor solar', 127, 16, 2000),
    ('00000000-0000-4000-9000-000000000301', '00000000-0000-4000-9000-000000000003', 'Barra principal', 126, 18, 2300),
    ('00000000-0000-4000-9000-000000000401', '00000000-0000-4000-9000-000000000004', 'Devanado primario', 126, 15, 1900),
    ('00000000-0000-4000-9000-000000000501', '00000000-0000-4000-9000-000000000005', 'Devanado primario', 126, 15, 1900),
    ('00000000-0000-4000-9000-000000000601', '00000000-0000-4000-9000-000000000006', 'Devanado primario', 126, 15, 1900),
    ('00000000-0000-4000-9000-000000000701', '00000000-0000-4000-9000-000000000007', 'Medidor de cabecera', 126, 14, 1700),
    ('00000000-0000-4000-9000-000000000801', '00000000-0000-4000-9000-000000000008', 'Medidor de cabecera', 126, 14, 1700),
    ('00000000-0000-4000-9000-000000000901', '00000000-0000-4000-9000-000000000009', 'Medidor de cabecera', 126, 16, 2000),
    ('00000000-0000-4000-9000-000000001001', '00000000-0000-4000-9000-000000000010', 'Acometida principal', 125, 12, 1500),
    ('00000000-0000-4000-9000-000000001101', '00000000-0000-4000-9000-000000000011', 'Acometida de bombas', 125, 14, 1700)
ON CONFLICT (id) DO NOTHING;

-- 30 lecturas por sensor nuevo, una cada 30 s hasta el momento de aplicar la semilla, con deriva suave
-- (senos con fase distinta por sensor) para que las minigráficas y los KPI tengan historia desde el inicio.
-- El id sale de un md5 fijo del sensor y del paso: aplicar otra vez no duplica nada.
INSERT INTO lecturas (id, sensor_id, voltaje, corriente, potencia, tomada_en)
SELECT md5('topologia-lectura-' || b.sensor_id || '-' || n)::uuid,
       b.sensor_id,
       v.voltaje,
       v.corriente,
       round((v.voltaje * v.corriente)::numeric, 2)::float8,
       now() - make_interval(secs => (29 - n) * 30)
FROM (VALUES
        ('00000000-0000-4000-9000-000000000101'::uuid, 121.0, 15.0, 1),
        ('00000000-0000-4000-9000-000000000102'::uuid, 120.5, 14.0, 2),
        ('00000000-0000-4000-9000-000000000201'::uuid, 120.0, 11.0, 3),
        ('00000000-0000-4000-9000-000000000301'::uuid, 120.2, 13.0, 4),
        ('00000000-0000-4000-9000-000000000401'::uuid, 119.8, 10.0, 5),
        ('00000000-0000-4000-9000-000000000501'::uuid, 122.6, 12.0, 6),
        ('00000000-0000-4000-9000-000000000601'::uuid, 120.0, 9.0, 7),
        ('00000000-0000-4000-9000-000000000701'::uuid, 119.5, 7.0, 8),
        ('00000000-0000-4000-9000-000000000801'::uuid, 120.3, 8.0, 9),
        ('00000000-0000-4000-9000-000000000901'::uuid, 119.0, 12.5, 10),
        ('00000000-0000-4000-9000-000000001001'::uuid, 120.1, 6.5, 11),
        ('00000000-0000-4000-9000-000000001101'::uuid, 119.7, 9.5, 12)
     ) AS b (sensor_id, tension, corriente, fase)
CROSS JOIN generate_series(0, 29) AS n
CROSS JOIN LATERAL (
    SELECT round((b.tension + 1.8 * sin(n / 4.0 + b.fase))::numeric, 2)::float8 AS voltaje,
           round((b.corriente * (1 + 0.15 * sin(n / 6.0 + b.fase * 0.7)))::numeric, 2)::float8 AS corriente
) AS v
ON CONFLICT (id) DO NOTHING;
