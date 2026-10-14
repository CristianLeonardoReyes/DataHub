-- Estado vigente. Origen: Migraciones/2026-10-14_acceso_usuario_token.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_Usuario_RegistrarIntentoFallido`$$
CREATE PROCEDURE `sp_Usuario_RegistrarIntentoFallido`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET BloqueadoHasta     = IF(IntentosFallidos + 1 >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), BloqueadoHasta),
      IntentosFallidos   = IF(IntentosFallidos + 1 >= 5, 0, IntentosFallidos + 1),
      FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId AND Estado = 'activo';
END$$

DELIMITER ;
