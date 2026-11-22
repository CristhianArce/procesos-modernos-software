-- HU 5 (#22): una alerta por cada magnitud de una lectura que supera el umbral de su sensor.
-- Una sola severidad y sin estado (RN-3, RN-4); la fecha es la de registro (decisión #9).
CREATE TABLE alertas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id uuid NOT NULL REFERENCES sensores (id) ON DELETE CASCADE,
    magnitud text NOT NULL CHECK (magnitud IN ('voltaje', 'corriente', 'potencia')),
    valor double precision NOT NULL,
    umbral double precision NOT NULL,
    creada_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX alertas_creada_idx ON alertas (creada_en DESC);
CREATE INDEX alertas_sensor_creada_idx ON alertas (sensor_id, creada_en DESC);
