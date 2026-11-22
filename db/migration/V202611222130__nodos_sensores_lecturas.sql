-- HU 4 (#21): nodos, sensores y lecturas simuladas.
-- El estado existe desde ahora para que la HU 6 solo lo cambie (RN-2).
CREATE TABLE nodos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    ubicacion text,
    estado text NOT NULL DEFAULT 'conectado' CHECK (estado IN ('conectado', 'desconectado')),
    creado_en timestamptz NOT NULL DEFAULT now()
);

-- Los umbrales son máximos y opcionales, uno por magnitud; la HU 5 los lee (decisión #3).
CREATE TABLE sensores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nodo_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE,
    nombre text NOT NULL,
    umbral_voltaje double precision CHECK (umbral_voltaje > 0),
    umbral_corriente double precision CHECK (umbral_corriente > 0),
    umbral_potencia double precision CHECK (umbral_potencia > 0),
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sensores_nodo_id_idx ON sensores (nodo_id);

-- Cada lectura trae las tres magnitudes (decisión #2).
CREATE TABLE lecturas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id uuid NOT NULL REFERENCES sensores (id) ON DELETE CASCADE,
    voltaje double precision NOT NULL,
    corriente double precision NOT NULL,
    potencia double precision NOT NULL,
    tomada_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lecturas_sensor_tomada_idx ON lecturas (sensor_id, tomada_en DESC);
