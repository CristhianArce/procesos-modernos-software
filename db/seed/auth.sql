-- Cuentas de demostración de la HU 3 (#20). Solo el hash scrypt; las contraseñas están en el README.
-- Idempotente: aplicar la semilla otra vez no duplica ni cambia las cuentas.
INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES
    ('admin', 'scrypt$c28f28491bcae31fe8c48c83b9ef4e3b$38abc9990d3e89347732e3c9bfbe6cac871ce185c322329e6c98e1ab98e9ebeb8145bf8d7711325989f0f907abc46b20579345430f08d65c5161e83aaf70ed8f', 'administrador'),
    ('tecnico', 'scrypt$75b734847765d276b3bd9866f4bae3d1$3e3ffc0cc466d41c70eaa192240ec436b4da04d191ea276125139c63667330fd0d8056d32b3741adb465909ff3a4a85ff60461fbab03ca962ff4adf93db42e44', 'tecnico')
ON CONFLICT (nombre_usuario) DO NOTHING;
