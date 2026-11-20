-- Crea un Super admin invitado y devuelve su enlace de aceptación (pruebas y producción; no es migración).
-- Requiere todas las migraciones aplicadas. No guarda contraseñas: la persona la define al aceptar.
--
-- Antes de ejecutar, edita las tres variables:
--   @correo   correo real de la persona (único en Usuario).
--   @nombre   nombre visible.
--   @urlBase  URL pública de la app, sin "/" final:
--             local  http://localhost:5173
--             pruebas/producción  https://<dominio de la Web App>
--
-- El enlace vale 72 h y equivale a una credencial: entrégalo solo a esa persona, por un canal privado.
-- Si vence, vuelve a ejecutar solo el bloque del token (o elimina el usuario invitado y repite).

SET @correo  = 'nombre.apellido@empresa.com' COLLATE utf8mb4_0900_ai_ci;
SET @nombre  = 'Super admin' COLLATE utf8mb4_0900_ai_ci;
SET @urlBase = 'https://<dominio>' COLLATE utf8mb4_0900_ai_ci;

SET @token = LOWER(HEX(RANDOM_BYTES(32)));

START TRANSACTION;

-- Falla con "Duplicate entry ... UQ_Usuario_Correo" si el correo ya existe: en ese caso ejecuta ROLLBACK.
INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
VALUES (NULL, LOWER(TRIM(@correo)), TRIM(@nombre), 'super_admin', 'invitado');

SET @usuarioId = LAST_INSERT_ID();

-- Se guarda solo el hash SHA-256 del token, como hace la API.
INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
VALUES (@usuarioId, 'invitacion', SHA2(@token, 256), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 72 HOUR));

COMMIT;

SELECT LOWER(TRIM(@correo)) AS Correo,
       CONCAT(TRIM(TRAILING '/' FROM @urlBase), '/aceptar-invitacion?token=', @token) AS Enlace,
       DATE_ADD(UTC_TIMESTAMP(), INTERVAL 72 HOUR) AS VenceUtc;
