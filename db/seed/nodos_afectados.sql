-- Afectados de demostración de la HU 8 (#25). Se llama nodos_afectados.sql para aplicarse después de nodos.sql
-- (scripts/seed.mjs sigue el orden alfabético). Subestación Sur tiene un afectado; Subestación Norte, ninguno.
INSERT INTO nodo_usuarios (id, nodo_id, alias) VALUES
    ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000000002', 'Usuario demo 02')
ON CONFLICT (id) DO NOTHING;
