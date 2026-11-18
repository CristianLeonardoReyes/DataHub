-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 la colección no existe o está fuera de alcance, 1 ok (devuelve Guid),
-- 2 el padre no está en la misma colección o no existe.
DROP PROCEDURE IF EXISTS `pag_insertar`$$
CREATE PROCEDURE `pag_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_ColeccionGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_PaginaPadreGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Titulo VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_ColeccionId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_WorkspaceId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Id BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT c.Id, w.Id INTO v_ColeccionId, v_WorkspaceId
  FROM Coleccion c JOIN Espacio e ON e.Id = c.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE c.ClienteId = p_ClienteId AND c.Guid = p_ColeccionGuid AND c.FechaEliminacion IS NULL
    AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_ColeccionId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    IF p_PaginaPadreGuid IS NOT NULL THEN
      SELECT Id INTO v_PadreId FROM Pagina
      WHERE ClienteId = p_ClienteId AND Guid = p_PaginaPadreGuid AND ColeccionId = v_ColeccionId AND FechaEliminacion IS NULL;
    END IF;
    IF p_PaginaPadreGuid IS NOT NULL AND v_PadreId IS NULL THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSE
      INSERT INTO Pagina (ClienteId, WorkspaceId, ColeccionId, PaginaPadreId, Titulo, Slug, Posicion, CreadoPor, ActualizadoPor)
      SELECT p_ClienteId, v_WorkspaceId, v_ColeccionId, v_PadreId, p_Titulo, p_Slug, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId, p_UsuarioId
      FROM Pagina WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL;
      SET v_Id = LAST_INSERT_ID();
      COMMIT;
      SELECT 1 AS Resultado, Guid FROM Pagina WHERE Id = v_Id;
    END IF;
  END IF;
END$$

DELIMITER ;
