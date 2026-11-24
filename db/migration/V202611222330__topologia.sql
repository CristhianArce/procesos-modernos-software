-- Rediseño SCADA (rama ui/scada, sin issue): topología de la red para el mímico.
-- Tablas propias: no se modifica ninguna tabla de otro módulo; borrar un nodo borra su posición y sus enlaces.

-- Posición y símbolo de cada nodo en el lienzo del mímico. Un nodo sin fila aquí aún no está ubicado.
CREATE TABLE nodo_topologia (
    nodo_id uuid PRIMARY KEY REFERENCES nodos (id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('generacion', 'subestacion', 'transformador', 'alimentador', 'carga')),
    x double precision NOT NULL CHECK (x BETWEEN 0 AND 2000),
    y double precision NOT NULL CHECK (y BETWEEN 0 AND 2000),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- Enlace eléctrico entre dos nodos; el sentido (origen → destino) es el del flujo de energía en el mímico.
CREATE TABLE enlaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    origen_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE,
    destino_id uuid NOT NULL REFERENCES nodos (id) ON DELETE CASCADE,
    creado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT enlaces_sin_bucle CHECK (origen_id <> destino_id)
);

-- Un solo enlace por par de nodos, sin importar el sentido.
CREATE UNIQUE INDEX enlaces_par_idx ON enlaces (LEAST(origen_id, destino_id), GREATEST(origen_id, destino_id));
CREATE INDEX enlaces_destino_idx ON enlaces (destino_id);
