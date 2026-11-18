-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `pag_consultarRecientes`$$
CREATE PROCEDURE `pag_consultarRecientes`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1))
BEGIN
  SELECT p.Guid, p.Titulo, w.Nombre AS Workspace, c.Nombre AS Coleccion, p.FechaActualizacion
  FROM Pagina p
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Coleccion c ON c.Id = p.ColeccionId
  WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY p.FechaActualizacion DESC, p.Id DESC
  LIMIT 10;
END$$

DELIMITER ;
