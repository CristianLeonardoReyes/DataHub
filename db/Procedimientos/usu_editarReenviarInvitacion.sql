-- Estado vigente. Origen: Migraciones/2026-10-15_03_usuarios.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_editarReenviarInvitacion`$$
CREATE PROCEDURE `usu_editarReenviarInvitacion`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Horas INT)
BEGIN
  DECLARE v_UsuarioId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Estado VARCHAR(20) DEFAULT NULL;
  DECLARE v_Correo VARCHAR(254) DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT Id, Estado, Correo INTO v_UsuarioId, v_Estado, v_Correo
  FROM Usuario WHERE ClienteId = p_ClienteId AND Guid = p_Guid FOR UPDATE;

  IF v_UsuarioId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSEIF v_Estado <> 'invitado' THEN
    ROLLBACK;
    SELECT 2 AS Resultado;
  ELSE
    UPDATE UsuarioToken SET FechaUso = UTC_TIMESTAMP()
    WHERE UsuarioId = v_UsuarioId AND Tipo = 'invitacion' AND FechaUso IS NULL;
    INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
    VALUES (v_UsuarioId, 'invitacion', p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
    COMMIT;
    SELECT 1 AS Resultado, v_Correo AS Correo;
  END IF;
END$$

DELIMITER ;
