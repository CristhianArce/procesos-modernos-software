-- HU 3 (#20): usuarios del tablero. El rol repite los literales de ROLES en src/lib/session.ts.
CREATE TABLE usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_usuario text NOT NULL UNIQUE,
    contrasena_hash text NOT NULL,
    rol text NOT NULL CHECK (rol IN ('administrador', 'tecnico')),
    creado_en timestamptz NOT NULL DEFAULT now()
);
