-- Estado vigente. Origen: Migraciones/2026-11-19_01_metadata_etiquetas.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_consultarResponsables`$$
CREATE PROCEDURE `usu_consultarResponsables`(
  IN p_ClienteId BIGINT UNSIGNED)
BEGIN
  SELECT Guid, Nombre FROM Usuario
  WHERE ClienteId = p_ClienteId AND Estado <> 'inactivo'
  ORDER BY Nombre, Id;
END$$

DELIMITER ;
