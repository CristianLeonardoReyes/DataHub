-- Estado vigente. Origen: Migraciones/2026-10-15_03_usuarios.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `usu_editarPerfilEstado`$$
CREATE PROCEDURE `usu_editarPerfilEstado`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_ActorId BIGINT UNSIGNED,
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Perfil VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Activo TINYINT(1))
BEGIN
  DECLARE v_Admins INT DEFAULT 0;
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Perfil VARCHAR(20) DEFAULT NULL;
  DECLARE v_Estado VARCHAR(20) DEFAULT NULL;
  DECLARE v_NuevoEstado VARCHAR(20) DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT COUNT(*) INTO v_Admins FROM Usuario
  WHERE ClienteId = p_ClienteId AND Perfil = 'admin' AND Estado = 'activo' FOR UPDATE;
  SELECT Id, Perfil, Estado INTO v_Id, v_Perfil, v_Estado
  FROM Usuario WHERE ClienteId = p_ClienteId AND Guid = p_Guid FOR UPDATE;

  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    SET v_NuevoEstado = IF(v_Estado = 'invitado', 'invitado', IF(p_Activo = 1, 'activo', 'inactivo'));
    IF v_Estado = 'invitado' AND p_Activo = 0 THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSEIF v_Id = p_ActorId AND (p_Perfil <> v_Perfil OR v_NuevoEstado <> v_Estado) THEN
      ROLLBACK;
      SELECT 3 AS Resultado;
    ELSEIF v_Perfil = 'admin' AND v_Estado = 'activo' AND (p_Perfil <> 'admin' OR v_NuevoEstado <> 'activo') AND v_Admins <= 1 THEN
      ROLLBACK;
      SELECT 4 AS Resultado;
    ELSE
      UPDATE Usuario SET Perfil = p_Perfil, Estado = v_NuevoEstado, FechaActualizacion = UTC_TIMESTAMP()
      WHERE Id = v_Id;
      COMMIT;
      SELECT 1 AS Resultado, Guid, Nombre, Correo, Perfil, Estado, FechaCreacion FROM Usuario WHERE Id = v_Id;
    END IF;
  END IF;
END$$

DELIMITER ;
