-- Estado vigente. Origen: Migraciones/2026-10-08_tablas_cliente_usuario.sql

CREATE TABLE `Usuario` (
  `Id`                 BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `Guid`               CHAR(36)          NOT NULL DEFAULT (UUID()),
  `ClienteId`          BIGINT UNSIGNED   NULL,
  `Correo`             VARCHAR(254)      NOT NULL,
  `Nombre`             VARCHAR(150)      NOT NULL,
  `ContrasenaHash`     VARCHAR(255)      NULL,
  `Perfil`             ENUM('super_admin','admin','coordinador','colaborador') NOT NULL,
  `Estado`             ENUM('invitado','activo','inactivo') NOT NULL DEFAULT 'invitado',
  `IntentosFallidos`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `BloqueadoHasta`     DATETIME          NULL,
  `FechaCreacion`      DATETIME          NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `FechaActualizacion` DATETIME          NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Usuario_Guid` (`Guid`),
  UNIQUE KEY `UQ_Usuario_Correo` (`Correo`),
  KEY `IX_Usuario_ClienteId` (`ClienteId`),
  CONSTRAINT `FK_Usuario_Cliente` FOREIGN KEY (`ClienteId`)
    REFERENCES `Cliente` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `CK_Usuario_SuperAdminSinCliente`
    CHECK ((`Perfil` = 'super_admin') = (`ClienteId` IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
