-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 el padre no existe o está fuera de alcance, 1 ok (devuelve Guid).
DROP PROCEDURE IF EXISTS `esp_insertar`$$
CREATE PROCEDURE `esp_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_WorkspaceGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Id BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT w.Id INTO v_PadreId FROM Workspace w
  WHERE w.ClienteId = p_ClienteId AND w.Guid = p_WorkspaceGuid AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_PadreId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    INSERT INTO Espacio (ClienteId, WorkspaceId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
    SELECT p_ClienteId, v_PadreId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
    FROM Espacio WHERE WorkspaceId = v_PadreId AND FechaEliminacion IS NULL;
    SET v_Id = LAST_INSERT_ID();
    COMMIT;
    SELECT 1 AS Resultado, Guid FROM Espacio WHERE Id = v_Id;
  END IF;
END$$

DELIMITER ;
