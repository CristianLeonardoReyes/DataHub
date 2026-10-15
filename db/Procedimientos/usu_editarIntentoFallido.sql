-- Estado vigente. Origen: Migraciones/2026-10-15_01_renombrar_sp_acceso.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_editarIntentoFallido`$$
CREATE PROCEDURE `usu_editarIntentoFallido`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET BloqueadoHasta     = IF(IntentosFallidos + 1 >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), BloqueadoHasta),
      IntentosFallidos   = IF(IntentosFallidos + 1 >= 5, 0, IntentosFallidos + 1),
      FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId AND Estado = 'activo';
END$$

DELIMITER ;
