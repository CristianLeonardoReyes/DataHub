-- Estado vigente. Origen: Migraciones/2026-10-08_tablas_cliente_usuario.sql

CREATE TABLE `Cliente` (
  `Id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Guid`               CHAR(36)        NOT NULL DEFAULT (UUID()),
  `Nombre`             VARCHAR(150)    NOT NULL,
  `Slug`               VARCHAR(100)    NOT NULL,
  `Activo`             TINYINT(1)      NOT NULL DEFAULT 1,
  `FechaCreacion`      DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaActualizacion` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Cliente_Guid` (`Guid`),
  UNIQUE KEY `UQ_Cliente_Slug` (`Slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
