-- HU 10 (#27): técnico asignado a cada nodo. Tabla propia: solo referencia a nodos (HU 4) y usuarios (HU 3) sin modificarlas.
-- La clave primaria en nodo_id deja como máximo un técnico por nodo; asignar otro lo reemplaza (RN-3, decisión #2).
-- Que el usuario sea técnico (RN-1) lo verifica el servicio. Borrar el nodo o el usuario borra la asignación.
CREATE TABLE nodo_tecnicos (
    nodo_id uuid PRIMARY KEY REFERENCES nodos (id) ON DELETE CASCADE,
    tecnico_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    asignado_en timestamptz NOT NULL DEFAULT now()
);
