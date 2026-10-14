-- Tablas organization y user (PRD §6).
-- Nota: DEFAULT (UTC_TIMESTAMP()) es válido en MySQL 8.0.13+ como expresión por defecto.

CREATE TABLE `organization` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `guid`       CHAR(36)        NOT NULL DEFAULT (UUID()),
  `name`       VARCHAR(150)    NOT NULL,
  `slug`       VARCHAR(100)    NOT NULL,
  `is_active`  TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `updated_at` DATETIME        NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_organization_guid` (`guid`),
  UNIQUE KEY `uq_organization_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user` (
  `id`                 BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `guid`               CHAR(36)          NOT NULL DEFAULT (UUID()),
  `organization_id`    BIGINT UNSIGNED   NULL,
  `email`              VARCHAR(254)      NOT NULL,
  `name`               VARCHAR(150)      NOT NULL,
  `password_hash`      VARCHAR(255)      NULL,
  `role`               ENUM('super_admin','admin','coordinador','colaborador') NOT NULL,
  `status`             ENUM('invitado','activo','inactivo') NOT NULL DEFAULT 'invitado',
  `failed_login_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `lockout_until`      DATETIME          NULL,
  `created_at`         DATETIME          NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `updated_at`         DATETIME          NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_guid` (`guid`),
  UNIQUE KEY `uq_user_email` (`email`),
  KEY `ix_user_organization_id` (`organization_id`),
  CONSTRAINT `fk_user_organization` FOREIGN KEY (`organization_id`)
    REFERENCES `organization` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_user_super_admin_sin_org`
    CHECK ((`role` = 'super_admin') = (`organization_id` IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- REVERSIÓN (descomentar para revertir, en este orden)
-- DROP TABLE `user`;
-- DROP TABLE `organization`;
