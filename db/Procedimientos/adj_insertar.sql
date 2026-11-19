-- Estado vigente. Origen: Migraciones/2026-11-19_02_adjuntos.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `adj_insertar`$$
CREATE PROCEDURE `adj_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_NombreOriginal VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_RutaBlob VARCHAR(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TipoMime VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TamanoBytes BIGINT UNSIGNED)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado;
  ELSE
    INSERT INTO Adjunto (Guid, ClienteId, PaginaId, NombreOriginal, RutaBlob, TipoMime, TamanoBytes, SubidoPor)
    VALUES (p_Guid, p_ClienteId, v_Id, p_NombreOriginal, p_RutaBlob, p_TipoMime, p_TamanoBytes, p_UsuarioId);
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
