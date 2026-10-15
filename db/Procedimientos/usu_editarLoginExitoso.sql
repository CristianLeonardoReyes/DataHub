-- Estado vigente. Origen: Migraciones/2026-10-15_01_renombrar_sp_acceso.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_editarLoginExitoso`$$
CREATE PROCEDURE `usu_editarLoginExitoso`(IN p_UsuarioId BIGINT UNSIGNED)
BEGIN
  UPDATE Usuario
  SET IntentosFallidos = 0, BloqueadoHasta = NULL, FechaActualizacion = UTC_TIMESTAMP()
  WHERE Id = p_UsuarioId;
END$$

DELIMITER ;
