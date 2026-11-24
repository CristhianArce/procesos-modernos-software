-- HU 8 (#25): afectados de un nodo. Tabla propia; no se modifica ninguna tabla de otro módulo.
-- Un afectado es un alias ficticio asociado a un solo nodo (RN-1, RN-3). El alias puede repetirse en un nodo (RN-4).
-- Borrar un nodo borra sus afectados, para que la HU 4 elimine nodos sin fallar ni dejar huérfanos.
CREATE TABLE nodo_usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nodo_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE,
    alias text NOT NULL CHECK (char_length(btrim(alias)) BETWEEN 1 AND 100),
    creado_en timestamptz NOT NULL DEFAULT now()
);

-- La consulta de la ficha lista los afectados de un nodo en orden de creación.
CREATE INDEX nodo_usuarios_nodo_idx ON nodo_usuarios (nodo_id, creado_en, id);
