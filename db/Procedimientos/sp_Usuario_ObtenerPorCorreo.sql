-- Estado vigente. Origen: Migraciones/2026-10-14_acceso_usuario_token.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_Usuario_ObtenerPorCorreo`$$
CREATE PROCEDURE `sp_Usuario_ObtenerPorCorreo`(IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT u.Id, u.Guid, u.ClienteId, c.Guid AS ClienteGuid, c.Nombre AS ClienteNombre,
         u.Correo, u.Nombre, u.ContrasenaHash, u.Perfil, u.Estado,
         COALESCE(u.BloqueadoHasta > UTC_TIMESTAMP(), 0) AS Bloqueado
  FROM Usuario u
  LEFT JOIN Cliente c ON c.Id = u.ClienteId
  WHERE u.Correo = p_Correo;
END$$

DELIMITER ;
