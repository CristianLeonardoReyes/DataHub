-- Estado vigente. Origen: Migraciones/2026-10-15_02_clientes.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `cli_consultarPorGuid`$$
CREATE PROCEDURE `cli_consultarPorGuid`(IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT Guid, Nombre, Slug, Activo, FechaCreacion FROM Cliente WHERE Guid = p_Guid;
END$$

DELIMITER ;
