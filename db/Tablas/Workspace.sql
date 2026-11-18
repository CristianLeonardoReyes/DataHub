-- Estado vigente. Origen: Migraciones/2026-11-18_01_jerarquia_tablas.sql

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
