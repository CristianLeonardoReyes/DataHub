-- Estado vigente. Origen: Migraciones/2026-11-18_01_jerarquia_tablas.sql

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
