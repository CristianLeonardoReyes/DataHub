-- Estándar de nombres de SP: <prefijo de tabla>_<verbo><Calificador> (usu_, uto_, cli_...).
-- Crea los 8 SP de acceso con su nombre nuevo (mismo código vigente) y elimina los sp_* anteriores.
-- Re-ejecutable. Debe correr ANTES de 2026-10-15_02_clientes.sql.

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_consultarPorCorreo`$$
CREATE PROCEDURE `usu_consultarPorCorreo`(IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT u.Id, u.Guid, u.ClienteId, c.Guid AS ClienteGuid, c.Nombre AS ClienteNombre,
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
         u.Correo, u.Nombre, u.ContrasenaHash, u.Perfil, u.Estado,
         COALESCE(u.BloqueadoHasta > UTC_TIMESTAMP(), 0) AS Bloqueado
  FROM Usuario u
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE u.Guid = p_Guid;
END$$

-- Atómico: al 5.º fallo bloquea 15 min y reinicia el contador.

DROP PROCEDURE IF EXISTS `usu_editarIntentoFallido`$$
CREATE PROCEDURE `usu_editarIntentoFallido`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET BloqueadoHasta     = IF(IntentosFallidos + 1 >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), BloqueadoHasta),
      IntentosFallidos   = IF(IntentosFallidos + 1 >= 5, 0, IntentosFallidos + 1),
      FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId AND Estado = 'activo';
END$$

DROP PROCEDURE IF EXISTS `usu_editarLoginExitoso`$$
CREATE PROCEDURE `usu_editarLoginExitoso`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET IntentosFallidos = 0, BloqueadoHasta = NULL, FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId;
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

DROP PROCEDURE IF EXISTS `uto_insertar`$$
CREATE PROCEDURE `uto_insertar`(
  IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, IN p_Horas INT)
BEGIN
  INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
  VALUES (p_UsuarioId, p_Tipo, p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
END$$

DROP PROCEDURE IF EXISTS `uto_editarInvalidarPendientes`$$
CREATE PROCEDURE `uto_editarInvalidarPendientes`(IN p_UsuarioId BIGINT UNSIGNED, IN p_Tipo VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  UPDATE UsuarioToken SET FechaUso = UTC_TIMESTAMP()
  WHERE UsuarioId = p_UsuarioId AND Tipo = p_Tipo AND FechaUso IS NULL;
END$$

DELIMITER ;

-- Eliminar los nombres anteriores
DROP PROCEDURE IF EXISTS `sp_Usuario_ObtenerPorCorreo`;
DROP PROCEDURE IF EXISTS `sp_Usuario_ObtenerPorGuid`;
DROP PROCEDURE IF EXISTS `sp_Usuario_RegistrarIntentoFallido`;
DROP PROCEDURE IF EXISTS `sp_Usuario_RegistrarLoginExitoso`;
DROP PROCEDURE IF EXISTS `sp_Usuario_AceptarInvitacion`;
DROP PROCEDURE IF EXISTS `sp_Usuario_RestablecerContrasena`;
DROP PROCEDURE IF EXISTS `sp_UsuarioToken_Crear`;
DROP PROCEDURE IF EXISTS `sp_UsuarioToken_InvalidarPendientes`;

-- REVERSIÓN (descomentar para revertir)
-- 1) Re-ejecutar los archivos sp_*.sql de db/Procedimientos/ de la versión anterior (git) para recrear los nombres viejos.
-- DROP PROCEDURE IF EXISTS `usu_consultarPorCorreo`;
-- DROP PROCEDURE IF EXISTS `usu_consultarPorGuid`;
-- DROP PROCEDURE IF EXISTS `usu_editarIntentoFallido`;
-- DROP PROCEDURE IF EXISTS `usu_editarLoginExitoso`;
-- DROP PROCEDURE IF EXISTS `usu_editarAceptarInvitacion`;
-- DROP PROCEDURE IF EXISTS `usu_editarContrasena`;
-- DROP PROCEDURE IF EXISTS `uto_insertar`;
-- DROP PROCEDURE IF EXISTS `uto_editarInvalidarPendientes`;
