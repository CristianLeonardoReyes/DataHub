-- Módulo 7: archivos de páginas (PRD §6 Adjunto). Ejecutar con el cliente mysql (usa DELIMITER).
-- Tabla Adjunto y SP adj_insertar, adj_consultarPorPagina, adj_consultarPorGuid, adj_eliminar.
-- Alcance igual que pag_consultarPorGuid: cliente, workspace visible (p_VeTodo o WorkspaceMiembro) y página no eliminada.
-- El archivo vive en Azure Blob (RutaBlob); eliminar es lógico y no borra el blob (RF-ARC-06).
-- adj_insertar: 0 fuera de alcance, 1 ok.
-- adj_consultarPorPagina: primer result set Resultado 0 fuera de alcance / 1 ok; segundo, los adjuntos no eliminados.
-- adj_consultarPorGuid: una fila o ninguna (adjunto eliminado, de página eliminada o fuera de alcance).
-- adj_eliminar: 0 fuera de alcance, 1 ok, 3 p_SoloPropio = 1 y el adjunto es de otro usuario.

CREATE TABLE IF NOT EXISTS `Adjunto` (
  `Id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Guid`             CHAR(36)        NOT NULL DEFAULT (UUID()),
  `ClienteId`        BIGINT UNSIGNED NOT NULL,
  `PaginaId`         BIGINT UNSIGNED NOT NULL,
  `NombreOriginal`   VARCHAR(255)    NOT NULL,
  `RutaBlob`         VARCHAR(400)    NOT NULL,
  `TipoMime`         VARCHAR(150)    NOT NULL,
  `TamanoBytes`      BIGINT UNSIGNED NOT NULL,
  `SubidoPor`        BIGINT UNSIGNED NOT NULL,
  `FechaCreacion`    DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaEliminacion` DATETIME        NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Adjunto_Guid` (`Guid`),
  KEY `IX_Adjunto_ClienteId_FechaEliminacion` (`ClienteId`, `FechaEliminacion`),
  KEY `IX_Adjunto_PaginaId` (`PaginaId`),
  CONSTRAINT `FK_Adjunto_Cliente` FOREIGN KEY (`ClienteId`)
    REFERENCES `Cliente` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Adjunto_Pagina` FOREIGN KEY (`PaginaId`)
    REFERENCES `Pagina` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Adjunto_SubidoPor` FOREIGN KEY (`SubidoPor`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DELIMITER $$

DROP PROCEDURE IF EXISTS `adj_insertar`$$
CREATE PROCEDURE `adj_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_NombreOriginal VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_RutaBlob VARCHAR(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TipoMime VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TamanoBytes BIGINT UNSIGNED)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado;
  ELSE
    INSERT INTO Adjunto (Guid, ClienteId, PaginaId, NombreOriginal, RutaBlob, TipoMime, TamanoBytes, SubidoPor)
    VALUES (p_Guid, p_ClienteId, v_Id, p_NombreOriginal, p_RutaBlob, p_TipoMime, p_TamanoBytes, p_UsuarioId);
    SELECT 1 AS Resultado;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `adj_consultarPorPagina`$$
CREATE PROCEDURE `adj_consultarPorPagina`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_PaginaGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id INTO v_Id FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_PaginaGuid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado;
    SELECT NULL AS Guid, NULL AS NombreOriginal, NULL AS TipoMime, NULL AS TamanoBytes, NULL AS FechaCreacion,
           NULL AS SubidoPorGuid, NULL AS SubidoPorNombre FROM DUAL WHERE FALSE;
  ELSE
    SELECT 1 AS Resultado;
    SELECT a.Guid, a.NombreOriginal, a.TipoMime, a.TamanoBytes, a.FechaCreacion, u.Guid AS SubidoPorGuid, u.Nombre AS SubidoPorNombre
    FROM Adjunto a JOIN Usuario u ON u.Id = a.SubidoPor
    WHERE a.PaginaId = v_Id AND a.ClienteId = p_ClienteId AND a.FechaEliminacion IS NULL
    ORDER BY a.FechaCreacion, a.Id;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `adj_consultarPorGuid`$$
CREATE PROCEDURE `adj_consultarPorGuid`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT a.RutaBlob, a.NombreOriginal, a.TipoMime, u.Guid AS SubidoPorGuid
  FROM Adjunto a
  JOIN Pagina p ON p.Id = a.PaginaId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Usuario u ON u.Id = a.SubidoPor
  WHERE a.Guid = p_Guid AND a.ClienteId = p_ClienteId AND a.FechaEliminacion IS NULL
    AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
    AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
END$$

DROP PROCEDURE IF EXISTS `adj_eliminar`$$
CREATE PROCEDURE `adj_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_SoloPropio TINYINT(1))
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_SubidoPor BIGINT UNSIGNED DEFAULT NULL;
  SELECT a.Id, a.SubidoPor INTO v_Id, v_SubidoPor
  FROM Adjunto a
  JOIN Pagina p ON p.Id = a.PaginaId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE a.Guid = p_Guid AND a.ClienteId = p_ClienteId AND a.FechaEliminacion IS NULL
    AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
    AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    SELECT 0 AS Resultado;
  ELSEIF p_SoloPropio = 1 AND v_SubidoPor <> p_UsuarioId THEN
    SELECT 3 AS Resultado;
  ELSE
    UPDATE Adjunto SET FechaEliminacion = UTC_TIMESTAMP() WHERE Id = v_Id AND FechaEliminacion IS NULL;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;

-- REVERSIÓN (descomentar y ejecutar; borra los registros de adjuntos, no los blobs)
-- DROP PROCEDURE IF EXISTS `adj_eliminar`;
-- DROP PROCEDURE IF EXISTS `adj_consultarPorGuid`;
-- DROP PROCEDURE IF EXISTS `adj_consultarPorPagina`;
-- DROP PROCEDURE IF EXISTS `adj_insertar`;
-- DROP TABLE IF EXISTS `Adjunto`;
