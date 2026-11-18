-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 no existe o fuera de alcance, 1 ok, 2 padre inválido (otra colección, inexistente, la propia página o una descendiente).
-- p_PaginaPadreGuid NULL = página raíz de la colección. p_Posicion: índice 0-based entre hermanos (NULL = al final si cambió de padre).
DROP PROCEDURE IF EXISTS `pag_editar`$$
CREATE PROCEDURE `pag_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Titulo VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_PaginaPadreGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Posicion INT)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_ColeccionId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreActual BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Desc INT DEFAULT 0;
  DECLARE v_Final INT DEFAULT NULL;
  DECLARE v_Otros INT DEFAULT 0;
  DECLARE v_Pos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT p.Id, p.ColeccionId, p.PaginaPadreId INTO v_Id, v_ColeccionId, v_PadreActual
  FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    IF p_PaginaPadreGuid IS NOT NULL THEN
      SELECT Id INTO v_PadreId FROM Pagina
      WHERE ClienteId = p_ClienteId AND Guid = p_PaginaPadreGuid AND ColeccionId = v_ColeccionId AND FechaEliminacion IS NULL;
      IF v_PadreId = v_Id THEN
        SET v_Desc = 1;
      ELSEIF v_PadreId IS NOT NULL THEN
        SET v_Desc = (
          WITH RECURSIVE d AS (
            SELECT Id FROM Pagina WHERE PaginaPadreId = v_Id AND FechaEliminacion IS NULL
            UNION ALL
            SELECT h.Id FROM Pagina h JOIN d ON h.PaginaPadreId = d.Id WHERE h.FechaEliminacion IS NULL)
          SELECT COUNT(*) FROM d WHERE d.Id = v_PadreId);
      END IF;
    END IF;
    IF (p_PaginaPadreGuid IS NOT NULL AND v_PadreId IS NULL) OR v_Desc > 0 THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSE
      IF NOT (v_PadreActual <=> v_PadreId) THEN
        SELECT COALESCE(MAX(Posicion), -1) + 1 INTO v_Final FROM Pagina
        WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
      END IF;
      UPDATE Pagina
      SET Titulo = p_Titulo, Slug = p_Slug, PaginaPadreId = v_PadreId, Posicion = COALESCE(v_Final, Posicion),
          ActualizadoPor = p_UsuarioId, FechaActualizacion = UTC_TIMESTAMP()
      WHERE Id = v_Id;
      IF p_Posicion IS NOT NULL THEN
        SELECT COUNT(*) INTO v_Otros FROM Pagina
        WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
        SET v_Pos = LEAST(GREATEST(p_Posicion, 0), v_Otros);
        UPDATE Pagina t
        JOIN (SELECT Id, ROW_NUMBER() OVER (ORDER BY Posicion, Id) - 1 AS Rn FROM Pagina
              WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id) o ON o.Id = t.Id
        SET t.Posicion = o.Rn + IF(o.Rn >= v_Pos, 1, 0);
        UPDATE Pagina SET Posicion = v_Pos WHERE Id = v_Id;
      END IF;
      COMMIT;
      SELECT 1 AS Resultado;
    END IF;
  END IF;
END$$

DELIMITER ;
