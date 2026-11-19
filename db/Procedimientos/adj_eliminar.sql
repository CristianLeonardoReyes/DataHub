-- Estado vigente. Origen: Migraciones/2026-11-19_02_adjuntos.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `adj_eliminar`$$
CREATE PROCEDURE `adj_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_SoloPropio TINYINT(1))
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_SubidoPor BIGINT UNSIGNED DEFAULT NULL;
  SELECT a.Id, a.SubidoPor INTO v_Id, v_SubidoPor
  FROM Adjunto a
  JOIN Pagina p ON p.Id = a.PaginaId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE a.Guid = p_Guid AND a.ClienteId = p_ClienteId AND a.FechaEliminacion IS NULL
    AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
    AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado;
  ELSEIF p_SoloPropio = 1 AND v_SubidoPor <> p_UsuarioId THEN
    SELECT 3 AS Resultado;
  ELSE
    UPDATE Adjunto SET FechaEliminacion = UTC_TIMESTAMP() WHERE Id = v_Id AND FechaEliminacion IS NULL;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
