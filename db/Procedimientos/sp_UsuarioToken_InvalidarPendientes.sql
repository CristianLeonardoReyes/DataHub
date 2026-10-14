-- Estado vigente. Origen: Migraciones/2026-10-14_acceso_usuario_token.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_UsuarioToken_InvalidarPendientes`$$
CREATE PROCEDURE `sp_UsuarioToken_InvalidarPendientes`(IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  UPDATE UsuarioToken SET FechaUso = UTC_TIMESTAMP()
  WHERE UsuarioId = p_UsuarioId AND Tipo = p_Tipo AND FechaUso IS NULL;
END$$

DELIMITER ;
