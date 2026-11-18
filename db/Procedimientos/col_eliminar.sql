-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. Elimina (lógico) el elemento y todo lo que cuelga.
DROP PROCEDURE IF EXISTS `col_eliminar`$$
CREATE PROCEDURE `col_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Ahora DATETIME DEFAULT UTC_TIMESTAMP();
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT x.Id INTO v_Id FROM Coleccion x JOIN Espacio e ON e.Id = x.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE x.Guid = p_Guid AND x.ClienteId = p_ClienteId AND x.FechaEliminacion IS NULL AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Pagina SET FechaEliminacion = v_Ahora WHERE ColeccionId = v_Id AND FechaEliminacion IS NULL;
    UPDATE Coleccion SET FechaEliminacion = v_Ahora WHERE Id = v_Id;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
