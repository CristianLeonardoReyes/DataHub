-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Primer result set: Existe (el workspace existe en el cliente). Segundo: coordinadores y colaboradores no inactivos.
DROP PROCEDURE IF EXISTS `wkm_consultar`$$
CREATE PROCEDURE `wkm_consultar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_WorkspaceGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT Id INTO v_Id FROM Workspace WHERE ClienteId = p_ClienteId AND Guid = p_WorkspaceGuid AND FechaEliminacion IS NULL;
  SELECT v_Id IS NOT NULL AS Existe;
  SELECT u.Guid, u.Nombre, u.Correo, u.Perfil,
         EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = v_Id AND m.UsuarioId = u.Id) AS Asignado
  FROM Usuario u
  WHERE v_Id IS NOT NULL AND u.ClienteId = p_ClienteId AND u.Perfil IN ('coordinador', 'colaborador') AND u.Estado <> 'inactivo'
  ORDER BY u.Nombre, u.Id;
END$$

DELIMITER ;
