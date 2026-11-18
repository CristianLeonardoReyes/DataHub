-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado 1 ok (devuelve Guid).
DROP PROCEDURE IF EXISTS `wks_insertar`$$
CREATE PROCEDURE `wks_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED;
  INSERT INTO Workspace (ClienteId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
  SELECT p_ClienteId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
  FROM Workspace WHERE ClienteId = p_ClienteId AND FechaEliminacion IS NULL;
  SET v_Id = LAST_INSERT_ID();
  SELECT 1 AS Resultado, Guid FROM Workspace WHERE Id = v_Id;
END$$

DELIMITER ;
