-- Módulo 4: Jerarquía (PRD §6). Tablas Workspace, WorkspaceMiembro, Espacio, Coleccion y Pagina.
-- Sin PaginaContenido ni índices FULLTEXT (módulos 5 y 8).

CREATE TABLE `Workspace` (
  `Id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Guid`               CHAR(36)        NOT NULL DEFAULT (UUID()),
  `ClienteId`          BIGINT UNSIGNED NOT NULL,
  `Nombre`             VARCHAR(150)    NOT NULL,
  `Slug`               VARCHAR(200)    NOT NULL,
  `Descripcion`        VARCHAR(500)    NULL,
  `Posicion`           INT             NOT NULL DEFAULT 0,
  `CreadoPor`          BIGINT UNSIGNED NOT NULL,
  `FechaCreacion`      DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaActualizacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaEliminacion`   DATETIME        NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Workspace_Guid` (`Guid`),
  KEY `IX_Workspace_ClienteId_FechaEliminacion` (`ClienteId`, `FechaEliminacion`),
  CONSTRAINT `FK_Workspace_Cliente` FOREIGN KEY (`ClienteId`)
    REFERENCES `Cliente` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Workspace_CreadoPor` FOREIGN KEY (`CreadoPor`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `WorkspaceMiembro` (
  `WorkspaceId`   BIGINT UNSIGNED NOT NULL,
  `UsuarioId`     BIGINT UNSIGNED NOT NULL,
  `FechaCreacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`WorkspaceId`, `UsuarioId`),
  KEY `IX_WorkspaceMiembro_UsuarioId` (`UsuarioId`),
  CONSTRAINT `FK_WorkspaceMiembro_Workspace` FOREIGN KEY (`WorkspaceId`)
    REFERENCES `Workspace` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_WorkspaceMiembro_Usuario` FOREIGN KEY (`UsuarioId`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Espacio` (
  `Id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Guid`               CHAR(36)        NOT NULL DEFAULT (UUID()),
  `ClienteId`          BIGINT UNSIGNED NOT NULL,
  `WorkspaceId`        BIGINT UNSIGNED NOT NULL,
  `Nombre`             VARCHAR(150)    NOT NULL,
  `Slug`               VARCHAR(200)    NOT NULL,
  `Descripcion`        VARCHAR(500)    NULL,
  `Posicion`           INT             NOT NULL DEFAULT 0,
  `CreadoPor`          BIGINT UNSIGNED NOT NULL,
  `FechaCreacion`      DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaActualizacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaEliminacion`   DATETIME        NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Espacio_Guid` (`Guid`),
  KEY `IX_Espacio_ClienteId_FechaEliminacion` (`ClienteId`, `FechaEliminacion`),
  KEY `IX_Espacio_WorkspaceId` (`WorkspaceId`),
  CONSTRAINT `FK_Espacio_Cliente` FOREIGN KEY (`ClienteId`)
    REFERENCES `Cliente` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Espacio_Workspace` FOREIGN KEY (`WorkspaceId`)
    REFERENCES `Workspace` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Espacio_CreadoPor` FOREIGN KEY (`CreadoPor`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Coleccion` (
  `Id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Guid`               CHAR(36)        NOT NULL DEFAULT (UUID()),
  `ClienteId`          BIGINT UNSIGNED NOT NULL,
  `EspacioId`          BIGINT UNSIGNED NOT NULL,
  `Nombre`             VARCHAR(150)    NOT NULL,
  `Slug`               VARCHAR(200)    NOT NULL,
  `Descripcion`        VARCHAR(500)    NULL,
  `Posicion`           INT             NOT NULL DEFAULT 0,
  `CreadoPor`          BIGINT UNSIGNED NOT NULL,
  `FechaCreacion`      DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaActualizacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaEliminacion`   DATETIME        NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Coleccion_Guid` (`Guid`),
  KEY `IX_Coleccion_ClienteId_FechaEliminacion` (`ClienteId`, `FechaEliminacion`),
  KEY `IX_Coleccion_EspacioId` (`EspacioId`),
  CONSTRAINT `FK_Coleccion_Cliente` FOREIGN KEY (`ClienteId`)
    REFERENCES `Cliente` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Coleccion_Espacio` FOREIGN KEY (`EspacioId`)
    REFERENCES `Espacio` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_Coleccion_CreadoPor` FOREIGN KEY (`CreadoPor`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- REVERSIÓN (descomentar para revertir, en este orden)
-- DROP TABLE `Pagina`;
-- DROP TABLE `Coleccion`;
-- DROP TABLE `Espacio`;
-- DROP TABLE `WorkspaceMiembro`;
-- DROP TABLE `Workspace`;
