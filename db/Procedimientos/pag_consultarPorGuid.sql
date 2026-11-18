-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Result sets: 1) la página con su ubicación (vacío si no existe o fuera de alcance);
-- 2) páginas padre en orden (de la raíz al padre directo); 3) subpáginas directas.
DROP PROCEDURE IF EXISTS `pag_consultarPorGuid`$$
CREATE PROCEDURE `pag_consultarPorGuid`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id, p.PaginaPadreId INTO v_Id, v_PadreId FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));

  SELECT p.Guid, p.Titulo, c.Guid AS ColeccionGuid, c.Nombre AS ColeccionNombre, pp.Guid AS PaginaPadreGuid,
         p.FechaActualizacion, cr.Guid AS CreadoPorGuid,
         w.Guid AS WorkspaceGuid, w.Nombre AS WorkspaceNombre, e.Guid AS EspacioGuid, e.Nombre AS EspacioNombre
  FROM Pagina p
  JOIN Coleccion c ON c.Id = p.ColeccionId
  JOIN Espacio e ON e.Id = c.EspacioId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Usuario cr ON cr.Id = p.CreadoPor
  LEFT JOIN Pagina pp ON pp.Id = p.PaginaPadreId
  WHERE p.Id = v_Id;

  WITH RECURSIVE a AS (
    SELECT Id, PaginaPadreId, Guid, Titulo, 1 AS Nivel FROM Pagina WHERE Id = v_PadreId
    UNION ALL
    SELECT q.Id, q.PaginaPadreId, q.Guid, q.Titulo, a.Nivel + 1 FROM Pagina q JOIN a ON q.Id = a.PaginaPadreId)
  SELECT Guid, Titulo FROM a ORDER BY Nivel DESC;

  SELECT h.Guid, h.Titulo FROM Pagina h
  WHERE h.PaginaPadreId = v_Id AND h.ClienteId = p_ClienteId AND h.FechaEliminacion IS NULL
  ORDER BY h.Posicion, h.Id;
END$$

DELIMITER ;
