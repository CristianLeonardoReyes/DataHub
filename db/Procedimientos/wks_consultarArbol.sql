-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `wks_consultarArbol`$$
CREATE PROCEDURE `wks_consultarArbol`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1))
BEGIN
  SELECT w.Guid, w.Nombre, w.Descripcion
  FROM Workspace w
  WHERE w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY w.Posicion, w.Id;

  SELECT w.Guid AS WorkspaceGuid, e.Guid, e.Nombre, e.Descripcion
  FROM Espacio e JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE e.ClienteId = p_ClienteId AND e.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY e.Posicion, e.Id;

  SELECT e.Guid AS EspacioGuid, c.Guid, c.Nombre, c.Descripcion
  FROM Coleccion c JOIN Espacio e ON e.Id = c.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE c.ClienteId = p_ClienteId AND c.FechaEliminacion IS NULL
    AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY c.Posicion, c.Id;

  SELECT c.Guid AS ColeccionGuid, pp.Guid AS PaginaPadreGuid, p.Guid, p.Titulo
  FROM Pagina p
  JOIN Coleccion c ON c.Id = p.ColeccionId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  LEFT JOIN Pagina pp ON pp.Id = p.PaginaPadreId
  WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY p.Posicion, p.Id;
END$$

DELIMITER ;
