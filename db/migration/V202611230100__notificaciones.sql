-- HU 7 (#24): notificaciones de un técnico. Un solo destinatario por fila (decisión #4).
-- El sensor es una copia de su nombre, sin clave foránea, para que la notificación sobreviva al sensor (decisión #5);
-- no guarda umbral ni nodo (decisión #1). Sin unicidad por alerta: varios técnicos pueden recibir la misma.
CREATE TABLE notificaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    sensor_nombre text NOT NULL,
    magnitud text NOT NULL CHECK (magnitud IN ('voltaje', 'corriente', 'potencia')),
    valor double precision NOT NULL,
    alerta_creada_en timestamptz NOT NULL,
    leida boolean NOT NULL DEFAULT false,
    creada_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notificaciones_usuario_alerta_idx ON notificaciones (usuario_id, alerta_creada_en DESC);
