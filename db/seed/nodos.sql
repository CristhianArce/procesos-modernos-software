-- Nodos de demostración de la HU 4 (#21). Identificadores fijos para que la semilla sea repetible
-- y para que db/seed/sensores.sql pueda referirse a ellos.
INSERT INTO nodos (id, nombre, ubicacion) VALUES
    ('00000000-0000-4000-8000-000000000001', 'Subestación Norte', 'Bello, Antioquia'),
    ('00000000-0000-4000-8000-000000000002', 'Subestación Sur', 'Envigado, Antioquia')
ON CONFLICT (id) DO NOTHING;
