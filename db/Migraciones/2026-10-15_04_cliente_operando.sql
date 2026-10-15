-- Módulo 3c: cliente sobre el que opera el Super admin. Re-ejecutable. Usa DELIMITER (cliente mysql).
-- Nuevo SP: cli_consultarOperando (devuelve el Id interno, que cli_consultarPorGuid no expone).

DELIMITER $$

DROP PROCEDURE IF EXISTS `cli_consultarOperando`$$
CREATE PROCEDURE `cli_consultarOperando`(IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT Id, Guid, Nombre, Activo FROM Cliente WHERE Guid = p_Guid;
END$$

DELIMITER ;

-- REVERSIÓN
-- DROP PROCEDURE IF EXISTS `cli_consultarOperando`;
