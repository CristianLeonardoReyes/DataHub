-- Alinea la collation por defecto de la base con la de las tablas (utf8mb4_0900_ai_ci).
-- Se ejecuta conectado a la base DataHub (sin nombre: aplica a la base en uso).
-- Después hay que re-ejecutar 2026-10-14_acceso_usuario_token.sql: los SP guardan la collation
-- de la base del momento en que se crean.

ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- REVERSIÓN (descomentar para revertir)
-- ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
