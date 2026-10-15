-- Estado vigente. Origen: Migraciones/2026-10-15_01_renombrar_sp_acceso.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `uto_insertar`$$
CREATE PROCEDURE `uto_insertar`(
  IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_Horas INT)
BEGIN
  INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
  VALUES (p_UsuarioId, p_Tipo, p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
END$$

DELIMITER ;
