-- Estado vigente. Origen: Migraciones/2026-11-18_02_jerarquia_procedimientos.sql

DELIMITER $$

-- Resultado: 0 no existe o fuera de alcance, 1 ok, 3 prohibido (p_SoloPropiaSinHijas = 1 y la página es ajena o tiene subpáginas).
-- Elimina (lógico) la página y todas sus descendientes.
DROP PROCEDURE IF EXISTS `pag_eliminar`$$
CREATE PROCEDURE `pag_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_SoloPropiaSinHijas TINYINT(1))
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_CreadoPor BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Ahora DATETIME DEFAULT UTC_TIMESTAMP();
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT p.Id, p.CreadoPor INTO v_Id, v_CreadoPor FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSEIF p_SoloPropiaSinHijas = 1 AND (v_CreadoPor <> p_UsuarioId
      OR EXISTS (SELECT 1 FROM Pagina h WHERE h.PaginaPadreId = v_Id AND h.FechaEliminacion IS NULL)) THEN
    ROLLBACK;
    SELECT 3 AS Resultado;
  ELSE
    UPDATE Pagina t
    JOIN (
      WITH RECURSIVE d AS (
        SELECT Id FROM Pagina WHERE Id = v_Id
        UNION ALL
        SELECT h.Id FROM Pagina h JOIN d ON h.PaginaPadreId = d.Id WHERE h.FechaEliminacion IS NULL)
      SELECT Id FROM d) x ON x.Id = t.Id
    SET t.FechaEliminacion = v_Ahora;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
