-- SOLO DESARROLLO (no es migración). Crea un Super admin invitado y muestra el enlace de aceptación.
-- Edita @correo antes de ejecutar. Requiere las migraciones de Usuario y UsuarioToken.
SET @correo = 'admin@ejemplo.com';
SET @token  = LOWER(HEX(RANDOM_BYTES(32)));

INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
VALUES (NULL, @correo, 'Super admin', 'super_admin', 'invitado');

INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
VALUES (LAST_INSERT_ID(), 'invitacion', SHA2(@token, 256), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 72 HOUR));

SELECT CONCAT('http://localhost:5173/aceptar-invitacion?token=', @token) AS Enlace;
