-- Estado vigente. Origen: Migraciones/2026-11-19_01_metadata_etiquetas.sql

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
