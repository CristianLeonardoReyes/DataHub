-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. Elimina (lógico) el elemento y todo lo que cuelga.
DROP PROCEDURE IF EXISTS `esp_eliminar`$$
CREATE PROCEDURE `esp_eliminar`(
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
  SELECT x.Id INTO v_Id FROM Espacio x JOIN Workspace w ON w.Id = x.WorkspaceId
  WHERE x.Guid = p_Guid AND x.ClienteId = p_ClienteId AND x.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Pagina p JOIN Coleccion c ON c.Id = p.ColeccionId SET p.FechaEliminacion = v_Ahora
    WHERE c.EspacioId = v_Id AND p.FechaEliminacion IS NULL;
    UPDATE Coleccion SET FechaEliminacion = v_Ahora WHERE EspacioId = v_Id AND FechaEliminacion IS NULL;
    UPDATE Espacio SET FechaEliminacion = v_Ahora WHERE Id = v_Id;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
