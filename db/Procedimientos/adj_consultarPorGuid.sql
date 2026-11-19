-- Estado vigente. Origen: Migraciones/2026-11-19_02_adjuntos.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `adj_consultarPorGuid`$$
CREATE PROCEDURE `adj_consultarPorGuid`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT a.RutaBlob, a.NombreOriginal, a.TipoMime, u.Guid AS SubidoPorGuid
  FROM Adjunto a
  JOIN Pagina p ON p.Id = a.PaginaId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Usuario u ON u.Id = a.SubidoPor
  WHERE a.Guid = p_Guid AND a.ClienteId = p_ClienteId AND a.FechaEliminacion IS NULL
    AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
    AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
END$$

DELIMITER ;
