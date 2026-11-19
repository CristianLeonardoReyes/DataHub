-- Estado vigente. Origen: Migraciones/2026-11-19_02_adjuntos.sql

CREATE TABLE `Adjunto` (
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
