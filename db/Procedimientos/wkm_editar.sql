-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 workspace no existe, 1 ok (reemplaza el conjunto), 2 algún guid no es coordinador/colaborador no inactivo del cliente.
-- p_Usuarios: arreglo JSON de guids.
DROP PROCEDURE IF EXISTS `wkm_editar`$$
CREATE PROCEDURE `wkm_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_WorkspaceGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Usuarios JSON)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Invalidos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT Id INTO v_Id FROM Workspace
  WHERE ClienteId = p_ClienteId AND Guid = p_WorkspaceGuid AND FechaEliminacion IS NULL FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    SELECT COUNT(*) INTO v_Invalidos
    FROM JSON_TABLE(p_Usuarios, '$[*]' COLUMNS (UsuarioGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) j
    LEFT JOIN Usuario u ON u.Guid = j.UsuarioGuid AND u.ClienteId = p_ClienteId
      AND u.Perfil IN ('coordinador', 'colaborador') AND u.Estado <> 'inactivo'
    WHERE u.Id IS NULL;
    IF v_Invalidos > 0 THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSE
      DELETE FROM WorkspaceMiembro WHERE WorkspaceId = v_Id;
      INSERT INTO WorkspaceMiembro (WorkspaceId, UsuarioId)
      SELECT DISTINCT v_Id, u.Id
      FROM JSON_TABLE(p_Usuarios, '$[*]' COLUMNS (UsuarioGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) j
      JOIN Usuario u ON u.Guid = j.UsuarioGuid AND u.ClienteId = p_ClienteId;
      COMMIT;
      SELECT 1 AS Resultado;
    END IF;
  END IF;
END$$

DELIMITER ;
