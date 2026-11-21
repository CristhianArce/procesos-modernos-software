CREATE TABLE IF NOT EXISTS nodos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  estado text NOT NULL DEFAULT 'conectado'
);
ALTER TABLE nodos ADD COLUMN IF NOT EXISTS ubicacion text;
