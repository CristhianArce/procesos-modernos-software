-- Técnico asignado de demostración de la HU 10 (#27). Este archivo se llama como su tabla y no mantenimiento.sql para
-- aplicarse después de auth.sql y nodos.sql (orden alfabético, decisión #4).
-- La cuenta `tecnico` responde por «Subestación Norte»; «Subestación Sur» queda sin técnico. Idempotente: no pisa
-- una asignación hecha después.
INSERT INTO nodo_tecnicos (nodo_id, tecnico_id)
SELECT '00000000-0000-4000-8000-000000000001', id FROM usuarios WHERE nombre_usuario = 'tecnico'
ON CONFLICT (nodo_id) DO NOTHING;
