-- Módulo 3b: gestión de usuarios del cliente (RF-USR-01, 02, 04, 05). Re-ejecutable. Usa DELIMITER (cliente mysql).
-- Nuevos SP: usu_consultar, usu_insertarInvitado, usu_editarReenviarInvitacion, usu_editarPerfilEstado.
-- Todos reciben p_ClienteId y filtran por él. Las filas devuelven Resultado (código) y, si aplica, la fila de Usuario.

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_consultar`$$
CREATE PROCEDURE `usu_consultar`(IN p_ClienteId BIGINT UNSIGNED)
BEGIN
  SELECT Guid, Nombre, Correo, Perfil, Estado, FechaCreacion
  FROM Usuario
  WHERE ClienteId = p_ClienteId
  ORDER BY Nombre, Id;
END$$

-- Resultado: 1 ok (devuelve la fila), 3 correo duplicado (único en todo el sistema).
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

-- Resultado: 0 no existe (o es de otro cliente), 2 el usuario no está invitado, 1 ok (devuelve Correo).
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

-- Resultado: 0 no existe (o es de otro cliente), 1 ok (devuelve la fila),
--            2 invitado no se puede desactivar, 3 un Admin no se desactiva ni cambia su perfil,
--            4 el cliente quedaría sin Admin activo.
-- Bloquea (FOR UPDATE) los Admin activos del cliente y el usuario destino para evitar carreras.
DROP PROCEDURE IF EXISTS `usu_editarPerfilEstado`$$
CREATE PROCEDURE `usu_editarPerfilEstado`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_ActorId BIGINT UNSIGNED,
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Perfil VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Activo TINYINT(1))
BEGIN
  DECLARE v_Admins INT DEFAULT 0;
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Perfil VARCHAR(20) DEFAULT NULL;
  DECLARE v_Estado VARCHAR(20) DEFAULT NULL;
  DECLARE v_NuevoEstado VARCHAR(20) DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT COUNT(*) INTO v_Admins FROM Usuario
  WHERE ClienteId = p_ClienteId AND Perfil = 'admin' AND Estado = 'activo' FOR UPDATE;
  SELECT Id, Perfil, Estado INTO v_Id, v_Perfil, v_Estado
  FROM Usuario WHERE ClienteId = p_ClienteId AND Guid = p_Guid FOR UPDATE;

  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    SET v_NuevoEstado = IF(v_Estado = 'invitado', 'invitado', IF(p_Activo = 1, 'activo', 'inactivo'));
    IF v_Estado = 'invitado' AND p_Activo = 0 THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSEIF v_Id = p_ActorId AND (p_Perfil <> v_Perfil OR v_NuevoEstado <> v_Estado) THEN
      ROLLBACK;
      SELECT 3 AS Resultado;
    ELSEIF v_Perfil = 'admin' AND v_Estado = 'activo' AND (p_Perfil <> 'admin' OR v_NuevoEstado <> 'activo') AND v_Admins <= 1 THEN
      ROLLBACK;
      SELECT 4 AS Resultado;
    ELSE
      UPDATE Usuario SET Perfil = p_Perfil, Estado = v_NuevoEstado, FechaActualizacion = UTC_TIMESTAMP()
      WHERE Id = v_Id;
      COMMIT;
      SELECT 1 AS Resultado, Guid, Nombre, Correo, Perfil, Estado, FechaCreacion FROM Usuario WHERE Id = v_Id;
    END IF;
  END IF;
END$$

DELIMITER ;

-- REVERSIÓN (descomentar y ejecutar):
-- DROP PROCEDURE IF EXISTS `usu_consultar`;
-- DROP PROCEDURE IF EXISTS `usu_insertarInvitado`;
-- DROP PROCEDURE IF EXISTS `usu_editarReenviarInvitacion`;
-- DROP PROCEDURE IF EXISTS `usu_editarPerfilEstado`;
