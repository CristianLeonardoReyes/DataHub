-- Módulo 2: Clientes (RF-CLI-01, RF-CLI-02). Re-ejecutable. Ejecutar con el cliente mysql (usa DELIMITER).
-- Nuevos SP: cli_consultar, cli_consultarPorGuid, cli_insertarConAdmin, cli_editar.
-- Modificados: usu_consultarPorCorreo y usu_consultarPorGuid (columna ClienteActivo),
--              usu_editarAceptarInvitacion y usu_editarContrasena (exigen cliente activo).

DELIMITER $$

DROP PROCEDURE IF EXISTS `cli_consultar`$$
CREATE PROCEDURE `cli_consultar`()
BEGIN
  SELECT Guid, Nombre, Slug, Activo, FechaCreacion FROM Cliente ORDER BY Nombre, Id;
END$$

DROP PROCEDURE IF EXISTS `cli_consultarPorGuid`$$
CREATE PROCEDURE `cli_consultarPorGuid`(IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT Guid, Nombre, Slug, Activo, FechaCreacion FROM Cliente WHERE Guid = p_Guid;
END$$

-- Resultado: 1 ok, 2 slug duplicado, 3 correo duplicado. Devuelve ClienteGuid cuando es 1.
-- ponytail: la verificación previa no cubre una carrera exacta; en ese caso la UNIQUE falla con 500 (raro, reintentable).
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

-- Resultado: 0 no existe, 1 ok, 2 slug duplicado.
DROP PROCEDURE IF EXISTS `cli_editar`$$
CREATE PROCEDURE `cli_editar`(
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Activo TINYINT(1))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Guid = p_Guid) THEN
    SELECT 0 AS Resultado;
  ELSEIF EXISTS (SELECT 1 FROM Cliente WHERE Slug = p_Slug AND Guid <> p_Guid) THEN
    SELECT 2 AS Resultado;
  ELSE
    UPDATE Cliente
    SET Nombre = p_Nombre, Slug = p_Slug, Activo = p_Activo, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Guid = p_Guid;
    SELECT 1 AS Resultado;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `usu_consultarPorCorreo`$$
CREATE PROCEDURE `usu_consultarPorCorreo`(IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT u.Id, u.Guid, u.ClienteId, c.Guid AS ClienteGuid, c.Nombre AS ClienteNombre,
         COALESCE(c.Activo, 1) AS ClienteActivo,
         u.Correo, u.Nombre, u.ContrasenaHash, u.Perfil, u.Estado,
         COALESCE(u.BloqueadoHasta > UTC_TIMESTAMP(), 0) AS Bloqueado
  FROM Usuario u
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE u.Correo = p_Correo;
END$$

DROP PROCEDURE IF EXISTS `usu_consultarPorGuid`$$
CREATE PROCEDURE `usu_consultarPorGuid`(IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT u.Id, u.Guid, u.ClienteId, c.Guid AS ClienteGuid, c.Nombre AS ClienteNombre,
         COALESCE(c.Activo, 1) AS ClienteActivo,
         u.Correo, u.Nombre, u.ContrasenaHash, u.Perfil, u.Estado,
         COALESCE(u.BloqueadoHasta > UTC_TIMESTAMP(), 0) AS Bloqueado
  FROM Usuario u
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE u.Guid = p_Guid;
END$$

DROP PROCEDURE IF EXISTS `usu_editarAceptarInvitacion`$$
CREATE PROCEDURE `usu_editarAceptarInvitacion`(
  IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_ContrasenaHash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
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
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE t.TokenHash = p_TokenHash AND t.Tipo = 'invitacion' AND t.FechaUso IS NULL
    AND t.FechaExpiracion > UTC_TIMESTAMP() AND u.Estado = 'invitado'
    AND COALESCE(c.Activo, 1) = 1
  FOR UPDATE;

  IF v_TokenId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Usuario
    SET Nombre = p_Nombre, ContrasenaHash = p_ContrasenaHash, Estado = 'activo', FechaActualizacion = UTC_TIMESTAMP()
    WHERE Id = v_UsuarioId;
    UPDATE UsuarioToken SET FechaUso = UTC_TIMESTAMP() WHERE Id = v_TokenId;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `usu_editarContrasena`$$
CREATE PROCEDURE `usu_editarContrasena`(IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_ContrasenaHash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
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
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE t.TokenHash = p_TokenHash AND t.Tipo = 'reset' AND t.FechaUso IS NULL
    AND t.FechaExpiracion > UTC_TIMESTAMP() AND u.Estado = 'activo'
    AND COALESCE(c.Activo, 1) = 1
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

-- REVERSIÓN (descomentar y ejecutar):
-- DROP PROCEDURE IF EXISTS `cli_consultar`;
-- DROP PROCEDURE IF EXISTS `cli_consultarPorGuid`;
-- DROP PROCEDURE IF EXISTS `cli_insertarConAdmin`;
-- DROP PROCEDURE IF EXISTS `cli_editar`;
-- Los 4 SP de Usuario modificados vuelven a su versión anterior re-ejecutando los archivos vigentes:
--   db/Procedimientos/usu_consultarPorCorreo.sql, usu_consultarPorGuid.sql,
--   usu_editarAceptarInvitacion.sql, usu_editarContrasena.sql
-- (Con la reversión, el código de la API que lee ClienteActivo deja de aplicar la regla.)
