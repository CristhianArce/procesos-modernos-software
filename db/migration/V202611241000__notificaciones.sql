-- HU 7 (#24): centro de notificaciones de los técnicos.
-- Un solo destinatario por notificación (RN-2). El sensor es una copia de su nombre, sin clave foránea, para
-- que la notificación se conserve si el sensor se elimina (RN-5). No guarda el umbral ni el nodo.
-- Sin unicidad por alerta: la HU 12 puede notificar la misma alerta a varios técnicos.
CREATE TABLE notificaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    destinatario_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    sensor text NOT NULL,
    magnitud text NOT NULL CHECK (magnitud IN ('voltaje', 'corriente', 'potencia')),
    valor double precision NOT NULL,
    creada_en timestamptz NOT NULL,
    leida boolean NOT NULL DEFAULT false
);

CREATE INDEX notificaciones_destinatario_creada_idx ON notificaciones (destinatario_id, creada_en DESC);
