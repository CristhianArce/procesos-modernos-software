-- HU 14 (#54): afectados de un nodo. Tabla propia (decisión #2); la HU 8 la reutiliza.
-- Un afectado es un alias ficticio que pertenece a un solo nodo; el alias puede repetirse (RN-4).
CREATE TABLE nodo_usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nodo_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE,
    alias text NOT NULL CHECK (char_length(alias) BETWEEN 1 AND 100),
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX nodo_usuarios_nodo_idx ON nodo_usuarios (nodo_id);
