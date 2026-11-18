-- Estado vigente. Origen: Migraciones/2026-11-18_03_pagina_contenido.sql

CREATE TABLE `PaginaContenido` (
  `PaginaId`           BIGINT UNSIGNED NOT NULL,
  `ContenidoJson`      JSON            NOT NULL,
  `TextoPlano`         MEDIUMTEXT      NOT NULL,
  `VersionContenido`   INT UNSIGNED    NOT NULL,
  `FechaActualizacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`PaginaId`),
  CONSTRAINT `FK_PaginaContenido_Pagina` FOREIGN KEY (`PaginaId`)
    REFERENCES `Pagina` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
