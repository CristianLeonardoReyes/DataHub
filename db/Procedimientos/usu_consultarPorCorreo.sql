-- Estado vigente. Origen: Migraciones/2026-10-15_02_clientes.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_consultarPorCorreo`$$
CREATE PROCEDURE `usu_consultarPorCorreo`(IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT u.Id, u.Guid, u.ClienteId, c.Guid AS ClienteGuid, c.Nombre AS ClienteNombre,
         COALESCE(c.Activo, 1) AS ClienteActivo,
         u.Correo, u.Nombre, u.ContrasenaHash, u.Perfil, u.Estado,
         COALESCE(u.BloqueadoHasta > UTC_TIMESTAMP(), 0) AS Bloqueado
  FROM Usuario u
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE u.Correo = p_Correo;
END$$

DELIMITER ;
