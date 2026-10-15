-- Estado vigente. Origen: Migraciones/2026-10-15_03_usuarios.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_insertarInvitado`$$
CREATE PROCEDURE `usu_insertarInvitado`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Perfil VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Horas INT)
BEGIN
  DECLARE v_UsuarioId BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    ROLLBACK;
    SELECT 3 AS Resultado;
  END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  IF EXISTS (SELECT 1 FROM Usuario WHERE Correo = p_Correo) THEN
    ROLLBACK;
    SELECT 3 AS Resultado;
  ELSE
    INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
    VALUES (p_ClienteId, p_Correo, p_Correo, p_Perfil, 'invitado');
    SET v_UsuarioId = LAST_INSERT_ID();
    INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
    VALUES (v_UsuarioId, 'invitacion', p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
    COMMIT;
    SELECT 1 AS Resultado, Guid, Nombre, Correo, Perfil, Estado, FechaCreacion FROM Usuario WHERE Id = v_UsuarioId;
  END IF;
END$$

DELIMITER ;
