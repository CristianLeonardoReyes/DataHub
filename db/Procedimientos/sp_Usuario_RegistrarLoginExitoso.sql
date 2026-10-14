-- Estado vigente. Origen: Migraciones/2026-10-14_acceso_usuario_token.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_Usuario_RegistrarLoginExitoso`$$
CREATE PROCEDURE `sp_Usuario_RegistrarLoginExitoso`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET IntentosFallidos = 0, BloqueadoHasta = NULL, FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId;
END$$

DELIMITER ;
