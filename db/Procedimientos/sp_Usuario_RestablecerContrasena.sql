-- Estado vigente. Origen: Migraciones/2026-10-14_acceso_usuario_token.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_Usuario_RestablecerContrasena`$$
CREATE PROCEDURE `sp_Usuario_RestablecerContrasena`(IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_ContrasenaHash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_TokenId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_UsuarioId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT t.Id, t.UsuarioId INTO v_TokenId, v_UsuarioId
  FROM UsuarioToken t
  JOIN Usuario u ON u.Id = t.UsuarioId
  WHERE t.TokenHash = p_TokenHash AND t.Tipo = 'reset' AND t.FechaUso IS NULL
    AND t.FechaExpiracion > UTC_TIMESTAMP() AND u.Estado = 'activo'
  FOR UPDATE;

  IF v_TokenId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Usuario
    SET ContrasenaHash = p_ContrasenaHash, IntentosFallidos = 0, BloqueadoHasta = NULL, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Id = v_UsuarioId;
    UPDATE UsuarioToken SET FechaUso = UTC_TIMESTAMP() WHERE Id = v_TokenId;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
