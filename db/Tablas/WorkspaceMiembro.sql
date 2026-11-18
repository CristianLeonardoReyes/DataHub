-- Estado vigente. Origen: Migraciones/2026-11-18_01_jerarquia_tablas.sql

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
