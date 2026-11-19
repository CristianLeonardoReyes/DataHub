-- Estado vigente. Origen: Migraciones/2026-11-19_02_adjuntos.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `adj_consultarPorPagina`$$
CREATE PROCEDURE `adj_consultarPorPagina`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado;
    SELECT NULL AS Guid, NULL AS NombreOriginal, NULL AS TipoMime, NULL AS TamanoBytes, NULL AS FechaCreacion,
           NULL AS SubidoPorGuid, NULL AS SubidoPorNombre FROM DUAL WHERE FALSE;
  ELSE
    SELECT 1 AS Resultado;
    SELECT a.Guid, a.NombreOriginal, a.TipoMime, a.TamanoBytes, a.FechaCreacion, u.Guid AS SubidoPorGuid, u.Nombre AS SubidoPorNombre
    FROM Adjunto a JOIN Usuario u ON u.Id = a.SubidoPor
    WHERE a.PaginaId = v_Id AND a.ClienteId = p_ClienteId AND a.FechaEliminacion IS NULL
    ORDER BY a.FechaCreacion, a.Id;
  END IF;
END$$

DELIMITER ;
