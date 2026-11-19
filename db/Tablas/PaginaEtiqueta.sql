-- Estado vigente. Origen: Migraciones/2026-11-19_01_metadata_etiquetas.sql

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
