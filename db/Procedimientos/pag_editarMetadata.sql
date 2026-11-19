-- Estado vigente. Origen: Migraciones/2026-11-19_01_metadata_etiquetas.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `pag_editarMetadata`$$
CREATE PROCEDURE `pag_editarMetadata`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Estado VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TipoDocumento VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_ResponsableGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_FechaRevision DATE,
  IN p_Etiquetas JSON,
  IN p_PuedeAprobar TINYINT(1))
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_EstadoActual VARCHAR(20) DEFAULT NULL;
  DECLARE v_ResponsableId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT p.Id, p.Estado INTO v_Id, v_EstadoActual FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE OF p;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    IF p_ResponsableGuid IS NOT NULL THEN
      SELECT Id INTO v_ResponsableId FROM Usuario WHERE Guid = p_ResponsableGuid AND ClienteId = p_ClienteId AND Estado <> 'inactivo';
    END IF;
    IF p_ResponsableGuid IS NOT NULL AND v_ResponsableId IS NULL THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSEIF p_Estado = 'aprobado' AND v_EstadoActual <> 'aprobado' AND p_PuedeAprobar = 0 THEN
      ROLLBACK;
      SELECT 3 AS Resultado;
    ELSE
      UPDATE Pagina
      SET Estado = p_Estado, TipoDocumento = p_TipoDocumento, ResponsableId = v_ResponsableId, FechaRevision = p_FechaRevision,
          ActualizadoPor = p_UsuarioId, FechaActualizacion = UTC_TIMESTAMP()
      WHERE Id = v_Id;

      INSERT IGNORE INTO Etiqueta (ClienteId, Nombre)
      SELECT p_ClienteId, t.Nombre
      FROM JSON_TABLE(p_Etiquetas, '$[*]' COLUMNS (Nombre VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) t;

      DELETE FROM PaginaEtiqueta WHERE PaginaId = v_Id;
      INSERT INTO PaginaEtiqueta (PaginaId, EtiquetaId)
      SELECT DISTINCT v_Id, e.Id
      FROM JSON_TABLE(p_Etiquetas, '$[*]' COLUMNS (Nombre VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) t
      JOIN Etiqueta e ON e.ClienteId = p_ClienteId AND e.Nombre = t.Nombre;
      COMMIT;
      SELECT 1 AS Resultado;
    END IF;
  END IF;
END$$

DELIMITER ;
