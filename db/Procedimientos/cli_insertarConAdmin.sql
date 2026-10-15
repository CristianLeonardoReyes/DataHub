-- Estado vigente. Origen: Migraciones/2026-10-15_02_clientes.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `cli_insertarConAdmin`$$
CREATE PROCEDURE `cli_insertarConAdmin`(
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_CorreoAdmin VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Horas INT)
BEGIN
  DECLARE v_ClienteId BIGINT UNSIGNED;
  DECLARE v_UsuarioId BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  IF EXISTS (SELECT 1 FROM Cliente WHERE Slug = p_Slug) THEN
    ROLLBACK;
    SELECT 2 AS Resultado, NULL AS ClienteGuid;
  ELSEIF EXISTS (SELECT 1 FROM Usuario WHERE Correo = p_CorreoAdmin) THEN
    ROLLBACK;
    SELECT 3 AS Resultado, NULL AS ClienteGuid;
  ELSE
    INSERT INTO Cliente (Nombre, Slug) VALUES (p_Nombre, p_Slug);
    SET v_ClienteId = LAST_INSERT_ID();
    INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
    VALUES (v_ClienteId, p_CorreoAdmin, p_CorreoAdmin, 'admin', 'invitado');
    SET v_UsuarioId = LAST_INSERT_ID();
    INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
    VALUES (v_UsuarioId, 'invitacion', p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
    COMMIT;
    SELECT 1 AS Resultado, Guid AS ClienteGuid FROM Cliente WHERE Id = v_ClienteId;
  END IF;
END$$

DELIMITER ;
