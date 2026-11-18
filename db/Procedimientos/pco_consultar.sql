-- Estado vigente. Origen: Migraciones/2026-11-18_03_pagina_contenido.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `pco_consultar`$$
CREATE PROCEDURE `pco_consultar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado, NULL AS ContenidoJson, 0 AS VersionContenido;
  ELSE
    SELECT 1 AS Resultado, c.ContenidoJson, COALESCE(c.VersionContenido, 0) AS VersionContenido
    FROM (SELECT 1) u LEFT JOIN PaginaContenido c ON c.PaginaId = v_Id;
  END IF;
END$$

DELIMITER ;
