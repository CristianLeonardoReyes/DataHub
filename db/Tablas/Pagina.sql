-- Estado vigente (índice FULLTEXT: Migraciones/2026-11-19_03_busqueda.sql). Origen: Migraciones/2026-11-18_01_jerarquia_tablas.sql

CREATE TABLE `Pagina` (
  `Id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Guid`               CHAR(36)        NOT NULL DEFAULT (UUID()),
  `ClienteId`          BIGINT UNSIGNED NOT NULL,
  `WorkspaceId`        BIGINT UNSIGNED NOT NULL,
  `ColeccionId`        BIGINT UNSIGNED NOT NULL,
  `PaginaPadreId`      BIGINT UNSIGNED NULL,
  `Titulo`             VARCHAR(200)    NOT NULL,
  `Slug`               VARCHAR(200)    NOT NULL,
  `TipoDocumento`      ENUM('general','adr','api','runbook','arquitectura','onboarding','guia','procedimiento','manual','acta') NOT NULL DEFAULT 'general',
  `Estado`             ENUM('borrador','en_revision','aprobado','archivado') NOT NULL DEFAULT 'borrador',
  `ResponsableId`      BIGINT UNSIGNED NULL,
  `FechaRevision`      DATE            NULL,
  `Posicion`           INT             NOT NULL DEFAULT 0,
  `CreadoPor`          BIGINT UNSIGNED NOT NULL,
  `ActualizadoPor`     BIGINT UNSIGNED NOT NULL,
  `FechaCreacion`      DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaActualizacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaEliminacion`   DATETIME        NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Pagina_Guid` (`Guid`),
  KEY `IX_Pagina_ClienteId_FechaEliminacion` (`ClienteId`, `FechaEliminacion`),
  KEY `IX_Pagina_WorkspaceId` (`WorkspaceId`),
  KEY `IX_Pagina_ColeccionId_PaginaPadreId` (`ColeccionId`, `PaginaPadreId`),
  KEY `IX_Pagina_PaginaPadreId` (`PaginaPadreId`),
  CONSTRAINT `FK_Pagina_Cliente` FOREIGN KEY (`ClienteId`)
    REFERENCES `Cliente` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Pagina_Workspace` FOREIGN KEY (`WorkspaceId`)
    REFERENCES `Workspace` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Pagina_Coleccion` FOREIGN KEY (`ColeccionId`)
    REFERENCES `Coleccion` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Pagina_PaginaPadre` FOREIGN KEY (`PaginaPadreId`)
    REFERENCES `Pagina` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Pagina_Responsable` FOREIGN KEY (`ResponsableId`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Pagina_CreadoPor` FOREIGN KEY (`CreadoPor`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Pagina_ActualizadoPor` FOREIGN KEY (`ActualizadoPor`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FULLTEXT KEY `FT_Pagina_Titulo` (`Titulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
