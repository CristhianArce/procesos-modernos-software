-- HU 7 (#24): notificaciones de cada técnico. Un solo destinatario por fila (RN-2).
-- El sensor es una copia de su nombre, no una clave foránea: la notificación sobrevive al sensor (RN-5).
-- Sin umbral ni nodo y sin unicidad por alerta (la HU 12 puede notificar a varios técnicos).
-- `leida` la usa la HU 13 para marcar de una en una.
CREATE TABLE notificaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    sensor_nombre text NOT NULL,
    magnitud text NOT NULL CHECK (magnitud IN ('voltaje', 'corriente', 'potencia')),
    valor double precision NOT NULL,
    alerta_creada_en timestamptz NOT NULL,
    leida boolean NOT NULL DEFAULT false
);

CREATE INDEX notificaciones_usuario_fecha_idx ON notificaciones (usuario_id, alerta_creada_en DESC, id DESC);
