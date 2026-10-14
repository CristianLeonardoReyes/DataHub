-- Estado vigente. Origen: Migraciones/2026-10-14_acceso_usuario_token.sql

CREATE TABLE `UsuarioToken` (
  `Id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `UsuarioId`       BIGINT UNSIGNED NOT NULL,
  `Tipo`            ENUM('invitacion','reset') NOT NULL,
  `TokenHash`       CHAR(64)        NOT NULL,
  `FechaExpiracion` DATETIME        NOT NULL,
  `FechaUso`        DATETIME        NULL,
  `FechaCreacion`   DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_UsuarioToken_TokenHash` (`TokenHash`),
  KEY `IX_UsuarioToken_UsuarioId` (`UsuarioId`),
  CONSTRAINT `FK_UsuarioToken_Usuario` FOREIGN KEY (`UsuarioId`)
    REFERENCES `Usuario` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
