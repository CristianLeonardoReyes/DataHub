-- Estado vigente. Origen: Migraciones/2026-10-15_02_clientes.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `cli_consultar`$$
CREATE PROCEDURE `cli_consultar`()
BEGIN
  SELECT Guid, Nombre, Slug, Activo, FechaCreacion FROM Cliente ORDER BY Nombre, Id;
END$$

DELIMITER ;
