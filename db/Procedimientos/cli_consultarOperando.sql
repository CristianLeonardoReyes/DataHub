-- Estado vigente. Origen: Migraciones/2026-10-15_04_cliente_operando.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `cli_consultarOperando`$$
CREATE PROCEDURE `cli_consultarOperando`(IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT Id, Guid, Nombre, Activo FROM Cliente WHERE Guid = p_Guid;
END$$

DELIMITER ;
