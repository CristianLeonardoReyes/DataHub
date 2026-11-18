-- Estado vigente. Origen: Migraciones/2026-11-18_03_pagina_contenido.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `pco_editar`$$
CREATE PROCEDURE `pco_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_ContenidoJson JSON,
  IN p_TextoPlano MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Version INT UNSIGNED)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Actual INT UNSIGNED DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  -- El bloqueo de la fila de Pagina serializa los guardados concurrentes de la misma página.
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE OF p;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado, 0 AS VersionContenido;
  ELSE
    SELECT VersionContenido INTO v_Actual FROM PaginaContenido WHERE PaginaId = v_Id;
    IF v_Actual <> p_Version THEN
      ROLLBACK;
      SELECT 2 AS Resultado, v_Actual AS VersionContenido;
    ELSE
      IF v_Actual = 0 THEN
        INSERT INTO PaginaContenido (PaginaId, ContenidoJson, TextoPlano, VersionContenido) VALUES (v_Id, p_ContenidoJson, p_TextoPlano, 1);
      ELSE
        UPDATE PaginaContenido
        SET ContenidoJson = p_ContenidoJson, TextoPlano = p_TextoPlano, VersionContenido = p_Version + 1, FechaActualizacion = UTC_TIMESTAMP()
        WHERE PaginaId = v_Id AND VersionContenido = p_Version;
      END IF;
      UPDATE Pagina SET ActualizadoPor = p_UsuarioId, FechaActualizacion = UTC_TIMESTAMP() WHERE Id = v_Id;
      COMMIT;
      SELECT 1 AS Resultado, p_Version + 1 AS VersionContenido;
    END IF;
  END IF;
END$$

DELIMITER ;
