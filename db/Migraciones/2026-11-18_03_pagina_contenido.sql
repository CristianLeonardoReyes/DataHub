-- Módulo 5: contenido de las páginas (PRD §6 PaginaContenido). Ejecutar con el cliente mysql (usa DELIMITER).
-- Tabla PaginaContenido (sin FULLTEXT: módulo 8) y SP pco_consultar, pco_editar.
-- Alcance igual que pag_consultarPorGuid: cliente, workspace visible (p_VeTodo o WorkspaceMiembro) y página no eliminada.
-- pco_consultar: Resultado 0 fuera de alcance; 1 ok (ContenidoJson NULL y VersionContenido 0 si aún no hay fila).
-- pco_editar: Resultado 0 fuera de alcance, 1 ok, 2 conflicto de versión (sin fila cuenta como versión 0).
--             Devuelve también VersionContenido (la nueva si 1; la guardada si 2).

CREATE TABLE IF NOT EXISTS `PaginaContenido` (
  `PaginaId`           BIGINT UNSIGNED NOT NULL,
  `ContenidoJson`      JSON            NOT NULL,
  `TextoPlano`         MEDIUMTEXT      NOT NULL,
  `VersionContenido`   INT UNSIGNED    NOT NULL,
  `FechaActualizacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`PaginaId`),
  CONSTRAINT `FK_PaginaContenido_Pagina` FOREIGN KEY (`PaginaId`)
    REFERENCES `Pagina` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DELIMITER $$

DROP PROCEDURE IF EXISTS `pco_consultar`$$
CREATE PROCEDURE `pco_consultar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado, NULL AS ContenidoJson, 0 AS VersionContenido;
  ELSE
    SELECT 1 AS Resultado, c.ContenidoJson, COALESCE(c.VersionContenido, 0) AS VersionContenido
    FROM (SELECT 1) u LEFT JOIN PaginaContenido c ON c.PaginaId = v_Id;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `pco_editar`$$
CREATE PROCEDURE `pco_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_ContenidoJson JSON,
  IN p_TextoPlano MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Version INT UNSIGNED)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Actual INT UNSIGNED DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  -- El bloqueo de la fila de Pagina serializa los guardados concurrentes de la misma página.
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE OF p;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado, 0 AS VersionContenido;
  ELSE
    SELECT VersionContenido INTO v_Actual FROM PaginaContenido WHERE PaginaId = v_Id;
    IF v_Actual <> p_Version THEN
      ROLLBACK;
      SELECT 2 AS Resultado, v_Actual AS VersionContenido;
    ELSE
      IF v_Actual = 0 THEN
        INSERT INTO PaginaContenido (PaginaId, ContenidoJson, TextoPlano, VersionContenido) VALUES (v_Id, p_ContenidoJson, p_TextoPlano, 1);
      ELSE
        UPDATE PaginaContenido
        SET ContenidoJson = p_ContenidoJson, TextoPlano = p_TextoPlano, VersionContenido = p_Version + 1, FechaActualizacion = UTC_TIMESTAMP()
        WHERE PaginaId = v_Id AND VersionContenido = p_Version;
      END IF;
      UPDATE Pagina SET ActualizadoPor = p_UsuarioId, FechaActualizacion = UTC_TIMESTAMP() WHERE Id = v_Id;
      COMMIT;
      SELECT 1 AS Resultado, p_Version + 1 AS VersionContenido;
    END IF;
  END IF;
END$$

DELIMITER ;

-- REVERSIÓN (descomentar y ejecutar; borra el contenido de todas las páginas)
-- DROP PROCEDURE IF EXISTS `pco_editar`;
-- DROP PROCEDURE IF EXISTS `pco_consultar`;
-- DROP TABLE IF EXISTS `PaginaContenido`;
