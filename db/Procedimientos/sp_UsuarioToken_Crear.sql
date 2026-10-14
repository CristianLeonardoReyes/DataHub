-- Estado vigente. Origen: Migraciones/2026-10-14_acceso_usuario_token.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_UsuarioToken_Crear`$$
CREATE PROCEDURE `sp_UsuarioToken_Crear`(
  IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_Horas INT)
BEGIN
  INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
  VALUES (p_UsuarioId, p_Tipo, p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
END$$

DELIMITER ;
