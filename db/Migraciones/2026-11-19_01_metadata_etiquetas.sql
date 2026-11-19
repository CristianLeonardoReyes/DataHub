-- Módulo 6: metadata y etiquetas de páginas (PRD §4.6, §6). Ejecutar con el cliente mysql (usa DELIMITER).
-- Tablas Etiqueta y PaginaEtiqueta; SP pag_editarMetadata, eti_consultar, usu_consultarResponsables;
-- pag_consultarPorGuid devuelve además la metadata y un 4.º result set con los nombres de etiquetas.
-- pag_editarMetadata: 0 fuera de alcance, 1 ok, 2 responsable no válido, 3 sin permiso para aprobar.
--   p_Etiquetas: arreglo JSON de nombres ya normalizados; reemplaza el conjunto de etiquetas de la página.

CREATE TABLE `Etiqueta` (
  `Id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Guid`          CHAR(36)        NOT NULL DEFAULT (UUID()),
  `ClienteId`     BIGINT UNSIGNED NOT NULL,
  `Nombre`        VARCHAR(50)     NOT NULL,
  `FechaCreacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Etiqueta_Guid` (`Guid`),
  UNIQUE KEY `UQ_Etiqueta_ClienteId_Nombre` (`ClienteId`, `Nombre`),
  CONSTRAINT `FK_Etiqueta_Cliente` FOREIGN KEY (`ClienteId`)
    REFERENCES `Cliente` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `PaginaEtiqueta` (
  `PaginaId`   BIGINT UNSIGNED NOT NULL,
  `EtiquetaId` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`PaginaId`, `EtiquetaId`),
  KEY `IX_PaginaEtiqueta_EtiquetaId` (`EtiquetaId`),
  CONSTRAINT `FK_PaginaEtiqueta_Pagina` FOREIGN KEY (`PaginaId`)
    REFERENCES `Pagina` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_PaginaEtiqueta_Etiqueta` FOREIGN KEY (`EtiquetaId`)
    REFERENCES `Etiqueta` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DELIMITER $$

DROP PROCEDURE IF EXISTS `pag_editarMetadata`$$
CREATE PROCEDURE `pag_editarMetadata`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Estado VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TipoDocumento VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_ResponsableGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_FechaRevision DATE,
  IN p_Etiquetas JSON,
  IN p_PuedeAprobar TINYINT(1))
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_EstadoActual VARCHAR(20) DEFAULT NULL;
  DECLARE v_ResponsableId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT p.Id, p.Estado INTO v_Id, v_EstadoActual FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE OF p;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    IF p_ResponsableGuid IS NOT NULL THEN
      SELECT Id INTO v_ResponsableId FROM Usuario WHERE Guid = p_ResponsableGuid AND ClienteId = p_ClienteId AND Estado <> 'inactivo';
    END IF;
    IF p_ResponsableGuid IS NOT NULL AND v_ResponsableId IS NULL THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSEIF p_Estado = 'aprobado' AND v_EstadoActual <> 'aprobado' AND p_PuedeAprobar = 0 THEN
      ROLLBACK;
      SELECT 3 AS Resultado;
    ELSE
      UPDATE Pagina
      SET Estado = p_Estado, TipoDocumento = p_TipoDocumento, ResponsableId = v_ResponsableId, FechaRevision = p_FechaRevision,
          ActualizadoPor = p_UsuarioId, FechaActualizacion = UTC_TIMESTAMP()
      WHERE Id = v_Id;

      INSERT IGNORE INTO Etiqueta (ClienteId, Nombre)
      SELECT p_ClienteId, t.Nombre
      FROM JSON_TABLE(p_Etiquetas, '$[*]' COLUMNS (Nombre VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) t;

      DELETE FROM PaginaEtiqueta WHERE PaginaId = v_Id;
      INSERT INTO PaginaEtiqueta (PaginaId, EtiquetaId)
      SELECT DISTINCT v_Id, e.Id
      FROM JSON_TABLE(p_Etiquetas, '$[*]' COLUMNS (Nombre VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) t
      JOIN Etiqueta e ON e.ClienteId = p_ClienteId AND e.Nombre = t.Nombre;
      COMMIT;
      SELECT 1 AS Resultado;
    END IF;
  END IF;
END$$

DROP PROCEDURE IF EXISTS `eti_consultar`$$
CREATE PROCEDURE `eti_consultar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_Texto VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT Nombre FROM Etiqueta
  WHERE ClienteId = p_ClienteId
    AND (p_Texto = '' OR LEFT(Nombre, CHAR_LENGTH(p_Texto)) = p_Texto)
  ORDER BY Nombre
  LIMIT 10;
END$$

DROP PROCEDURE IF EXISTS `usu_consultarResponsables`$$
CREATE PROCEDURE `usu_consultarResponsables`(
  IN p_ClienteId BIGINT UNSIGNED)
BEGIN
  SELECT Guid, Nombre FROM Usuario
  WHERE ClienteId = p_ClienteId AND Estado <> 'inactivo'
  ORDER BY Nombre, Id;
END$$

DROP PROCEDURE IF EXISTS `pag_consultarPorGuid`$$
CREATE PROCEDURE `pag_consultarPorGuid`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id, p.PaginaPadreId INTO v_Id, v_PadreId FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));

  SELECT p.Guid, p.Titulo, c.Guid AS ColeccionGuid, c.Nombre AS ColeccionNombre, pp.Guid AS PaginaPadreGuid,
         p.FechaActualizacion, cr.Guid AS CreadoPorGuid,
         w.Guid AS WorkspaceGuid, w.Nombre AS WorkspaceNombre, e.Guid AS EspacioGuid, e.Nombre AS EspacioNombre,
         p.Estado, p.TipoDocumento, re.Guid AS ResponsableGuid, re.Nombre AS ResponsableNombre, p.FechaRevision
  FROM Pagina p
  JOIN Coleccion c ON c.Id = p.ColeccionId
  JOIN Espacio e ON e.Id = c.EspacioId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Usuario cr ON cr.Id = p.CreadoPor
  LEFT JOIN Usuario re ON re.Id = p.ResponsableId
  LEFT JOIN Pagina pp ON pp.Id = p.PaginaPadreId
  WHERE p.Id = v_Id;

  WITH RECURSIVE a AS (
    SELECT Id, PaginaPadreId, Guid, Titulo, 1 AS Nivel FROM Pagina WHERE Id = v_PadreId
    UNION ALL
    SELECT q.Id, q.PaginaPadreId, q.Guid, q.Titulo, a.Nivel + 1 FROM Pagina q JOIN a ON q.Id = a.PaginaPadreId)
  SELECT Guid, Titulo FROM a ORDER BY Nivel DESC;

  SELECT h.Guid, h.Titulo FROM Pagina h
  WHERE h.PaginaPadreId = v_Id AND h.ClienteId = p_ClienteId AND h.FechaEliminacion IS NULL
  ORDER BY h.Posicion, h.Id;

  SELECT et.Nombre FROM PaginaEtiqueta pe JOIN Etiqueta et ON et.Id = pe.EtiquetaId
  WHERE pe.PaginaId = v_Id ORDER BY et.Nombre;
END$$

DELIMITER ;

-- REVERSIÓN
-- DROP PROCEDURE IF EXISTS `pag_editarMetadata`;
-- DROP PROCEDURE IF EXISTS `eti_consultar`;
-- DROP PROCEDURE IF EXISTS `usu_consultarResponsables`;
-- DROP TABLE IF EXISTS `PaginaEtiqueta`;
-- DROP TABLE IF EXISTS `Etiqueta`;
-- Restaurar pag_consultarPorGuid: ejecutar db/Procedimientos/pag_consultarPorGuid.sql
