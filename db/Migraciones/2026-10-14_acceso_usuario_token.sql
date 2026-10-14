-- Módulo Acceso (PRD §4.1, §6): tabla UsuarioToken y procedimientos de autenticación.
-- Requiere 2026-10-08_tablas_cliente_usuario.sql. Se ejecuta con el cliente mysql (usa DELIMITER).
-- Re-ejecutable. Los parámetros de texto fijan su collation para no heredar la de la base.

CREATE TABLE IF NOT EXISTS `UsuarioToken` (
  `Id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `UsuarioId`       BIGINT UNSIGNED NOT NULL,
  `Tipo`            ENUM('invitacion','reset') NOT NULL,
  `TokenHash`       CHAR(64)        NOT NULL,
  `FechaExpiracion` DATETIME        NOT NULL,
  `FechaUso`        DATETIME        NULL,
  `FechaCreacion`   DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_UsuarioToken_TokenHash` (`TokenHash`),
  KEY `IX_UsuarioToken_UsuarioId` (`UsuarioId`),
  CONSTRAINT `FK_UsuarioToken_Usuario` FOREIGN KEY (`UsuarioId`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DELIMITER $$

-- Lookup previo a la autenticación: no hay cliente aún, por eso no recibe p_ClienteId.
DROP PROCEDURE IF EXISTS `sp_Usuario_ObtenerPorCorreo`$$
CREATE PROCEDURE `sp_Usuario_ObtenerPorCorreo`(IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT u.Id, u.Guid, u.ClienteId, c.Guid AS ClienteGuid, c.Nombre AS ClienteNombre,
         u.Correo, u.Nombre, u.ContrasenaHash, u.Perfil, u.Estado,
         COALESCE(u.BloqueadoHasta > UTC_TIMESTAMP(), 0) AS Bloqueado
  FROM Usuario u
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE u.Correo = p_Correo;
END$$

DROP PROCEDURE IF EXISTS `sp_Usuario_ObtenerPorGuid`$$
CREATE PROCEDURE `sp_Usuario_ObtenerPorGuid`(IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT u.Id, u.Guid, u.ClienteId, c.Guid AS ClienteGuid, c.Nombre AS ClienteNombre,
         u.Correo, u.Nombre, u.ContrasenaHash, u.Perfil, u.Estado,
         COALESCE(u.BloqueadoHasta > UTC_TIMESTAMP(), 0) AS Bloqueado
  FROM Usuario u
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE u.Guid = p_Guid;
END$$

-- Atómico: al 5.º fallo bloquea 15 min y reinicia el contador.
-- Ojo: en UPDATE de MySQL las asignaciones se evalúan en orden; BloqueadoHasta va antes de IntentosFallidos.
DROP PROCEDURE IF EXISTS `sp_Usuario_RegistrarIntentoFallido`$$
CREATE PROCEDURE `sp_Usuario_RegistrarIntentoFallido`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET BloqueadoHasta     = IF(IntentosFallidos + 1 >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), BloqueadoHasta),
      IntentosFallidos   = IF(IntentosFallidos + 1 >= 5, 0, IntentosFallidos + 1),
      FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId AND Estado = 'activo';
END$$

DROP PROCEDURE IF EXISTS `sp_Usuario_RegistrarLoginExitoso`$$
CREATE PROCEDURE `sp_Usuario_RegistrarLoginExitoso`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET IntentosFallidos = 0, BloqueadoHasta = NULL, FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId;
END$$

DROP PROCEDURE IF EXISTS `sp_UsuarioToken_Crear`$$
CREATE PROCEDURE `sp_UsuarioToken_Crear`(
  IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_Horas INT)
BEGIN
  INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
  VALUES (p_UsuarioId, p_Tipo, p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
END$$

DROP PROCEDURE IF EXISTS `sp_UsuarioToken_InvalidarPendientes`$$
CREATE PROCEDURE `sp_UsuarioToken_InvalidarPendientes`(IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  UPDATE UsuarioToken SET FechaUso = UTC_TIMESTAMP()
  WHERE UsuarioId = p_UsuarioId AND Tipo = p_Tipo AND FechaUso IS NULL;
END$$

-- Devuelve 1 si aceptó la invitación, 0 si el token no es válido (inexistente, usado, vencido o usuario no invitado).
DROP PROCEDURE IF EXISTS `sp_Usuario_AceptarInvitacion`$$
CREATE PROCEDURE `sp_Usuario_AceptarInvitacion`(
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
  WHERE t.TokenHash = p_TokenHash AND t.Tipo = 'invitacion' AND t.FechaUso IS NULL
    AND t.FechaExpiracion > UTC_TIMESTAMP() AND u.Estado = 'invitado'
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

-- Devuelve 1 si restableció, 0 si el token no es válido. También limpia el bloqueo.
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

-- REVERSIÓN (descomentar para revertir, en este orden)
-- DROP PROCEDURE `sp_Usuario_RestablecerContrasena`;
-- DROP PROCEDURE `sp_Usuario_AceptarInvitacion`;
-- DROP PROCEDURE `sp_UsuarioToken_InvalidarPendientes`;
-- DROP PROCEDURE `sp_UsuarioToken_Crear`;
-- DROP PROCEDURE `sp_Usuario_RegistrarLoginExitoso`;
-- DROP PROCEDURE `sp_Usuario_RegistrarIntentoFallido`;
-- DROP PROCEDURE `sp_Usuario_ObtenerPorGuid`;
-- DROP PROCEDURE `sp_Usuario_ObtenerPorCorreo`;
-- DROP TABLE `UsuarioToken`;
