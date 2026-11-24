-- Afectados de demostración de la HU 8 (#25), sobre los nodos de db/seed/nodos.sql. Este archivo se llama como su
-- tabla y no afectados.sql para aplicarse después de nodos.sql (orden alfabético, decisión #2).
-- «Subestación Norte» queda sin afectados y «Subestación Sur» tiene uno (decisión #6). Idempotente.
INSERT INTO nodo_usuarios (id, nodo_id, alias) VALUES
    ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000000002', 'Usuario demo 02')
ON CONFLICT (id) DO NOTHING;
