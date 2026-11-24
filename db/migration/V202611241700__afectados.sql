-- HU 8 (#25): afectados de un nodo. Tabla propia: solo referencia a nodos (HU 4) sin modificarla.
-- Un afectado es un alias ficticio de un solo nodo (RN-1, RN-3), sin unicidad (RN-4).
-- Borrar el nodo borra sus afectados (decisión #7).
CREATE TABLE nodo_usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nodo_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE,
    alias text NOT NULL CHECK (char_length(btrim(alias)) BETWEEN 1 AND 80),
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX nodo_usuarios_nodo_idx ON nodo_usuarios (nodo_id);
