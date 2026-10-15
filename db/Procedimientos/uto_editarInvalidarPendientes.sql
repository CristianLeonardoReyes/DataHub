-- Estado vigente. Origen: Migraciones/2026-10-15_01_renombrar_sp_acceso.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `uto_editarInvalidarPendientes`$$
CREATE PROCEDURE `uto_editarInvalidarPendientes`(IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  UPDATE UsuarioToken SET FechaUso = UTC_TIMESTAMP()
  WHERE UsuarioId = p_UsuarioId AND Tipo = p_Tipo AND FechaUso IS NULL;
END$$

DELIMITER ;
