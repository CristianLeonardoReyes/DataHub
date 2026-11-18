-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. p_Posicion: índice 0-based entre hermanos (NULL = no cambia).
DROP PROCEDURE IF EXISTS `col_editar`$$
CREATE PROCEDURE `col_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Posicion INT)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Otros INT DEFAULT 0;
  DECLARE v_Pos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT x.Id, x.EspacioId INTO v_Id, v_PadreId FROM Coleccion x JOIN Espacio e ON e.Id = x.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE x.Guid = p_Guid AND x.ClienteId = p_ClienteId AND x.FechaEliminacion IS NULL AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Coleccion SET Nombre = p_Nombre, Slug = p_Slug, Descripcion = p_Descripcion, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Id = v_Id;
    IF p_Posicion IS NOT NULL THEN
      SELECT COUNT(*) INTO v_Otros FROM Coleccion WHERE EspacioId = v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
      SET v_Pos = LEAST(GREATEST(p_Posicion, 0), v_Otros);
      UPDATE Coleccion t
      JOIN (SELECT Id, ROW_NUMBER() OVER (ORDER BY Posicion, Id) - 1 AS Rn FROM Coleccion
            WHERE EspacioId = v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id) o ON o.Id = t.Id
      SET t.Posicion = o.Rn + IF(o.Rn >= v_Pos, 1, 0);
      UPDATE Coleccion SET Posicion = v_Pos WHERE Id = v_Id;
    END IF;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
