-- Estado vigente. Origen: Migraciones/2026-10-15_03_usuarios.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_consultar`$$
CREATE PROCEDURE `usu_consultar`(IN p_ClienteId BIGINT UNSIGNED)
BEGIN
  SELECT Guid, Nombre, Correo, Perfil, Estado, FechaCreacion
  FROM Usuario
  WHERE ClienteId = p_ClienteId
  ORDER BY Nombre, Id;
END$$

DELIMITER ;
