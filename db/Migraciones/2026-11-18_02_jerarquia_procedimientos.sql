-- Módulo 4: Jerarquía. Re-ejecutable. Ejecutar con el cliente mysql (usa DELIMITER).
-- Nuevos SP: wks_consultarArbol, wks_insertar, wks_editar, wks_eliminar, wkm_consultar, wkm_editar,
--            esp_insertar, esp_editar, esp_eliminar, col_insertar, col_editar, col_eliminar,
--            pag_insertar, pag_editar, pag_eliminar, pag_consultarPorGuid, pag_consultarRecientes.
-- Modificado: usu_editarPerfilEstado (al pasar a 'admin' borra sus filas de WorkspaceMiembro).
-- Alcance (todos los SP de datos): un workspace es visible si ClienteId = p_ClienteId, no está eliminado y
-- (p_VeTodo = 1 o el usuario es miembro). Lo que cuelga de él hereda el alcance. Fuera de alcance = Resultado 0.
-- Códigos: 0 no existe o fuera de alcance, 1 ok, 2 dato inválido (padre/usuarios), 3 prohibido.

DELIMITER $$

DROP PROCEDURE IF EXISTS `wks_consultarArbol`$$
CREATE PROCEDURE `wks_consultarArbol`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1))
BEGIN
  SELECT w.Guid, w.Nombre, w.Descripcion
  FROM Workspace w
  WHERE w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY w.Posicion, w.Id;

  SELECT w.Guid AS WorkspaceGuid, e.Guid, e.Nombre, e.Descripcion
  FROM Espacio e JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE e.ClienteId = p_ClienteId AND e.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY e.Posicion, e.Id;

  SELECT e.Guid AS EspacioGuid, c.Guid, c.Nombre, c.Descripcion
  FROM Coleccion c JOIN Espacio e ON e.Id = c.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE c.ClienteId = p_ClienteId AND c.FechaEliminacion IS NULL
    AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY c.Posicion, c.Id;

  SELECT c.Guid AS ColeccionGuid, pp.Guid AS PaginaPadreGuid, p.Guid, p.Titulo
  FROM Pagina p
  JOIN Coleccion c ON c.Id = p.ColeccionId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  LEFT JOIN Pagina pp ON pp.Id = p.PaginaPadreId
  WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY p.Posicion, p.Id;
END$$

-- Resultado 1 ok (devuelve Guid).
DROP PROCEDURE IF EXISTS `wks_insertar`$$
CREATE PROCEDURE `wks_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED;
  INSERT INTO Workspace (ClienteId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
  SELECT p_ClienteId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
  FROM Workspace WHERE ClienteId = p_ClienteId AND FechaEliminacion IS NULL;
  SET v_Id = LAST_INSERT_ID();
  SELECT 1 AS Resultado, Guid FROM Workspace WHERE Id = v_Id;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. p_Posicion: índice 0-based entre hermanos (NULL = no cambia).
DROP PROCEDURE IF EXISTS `wks_editar`$$
CREATE PROCEDURE `wks_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Posicion INT)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Otros INT DEFAULT 0;
  DECLARE v_Pos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT w.Id INTO v_Id FROM Workspace w
  WHERE w.ClienteId = p_ClienteId AND w.Guid = p_Guid AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Workspace SET Nombre = p_Nombre, Slug = p_Slug, Descripcion = p_Descripcion, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Id = v_Id;
    IF p_Posicion IS NOT NULL THEN
      SELECT COUNT(*) INTO v_Otros FROM Workspace WHERE ClienteId = p_ClienteId AND FechaEliminacion IS NULL AND Id <> v_Id;
      SET v_Pos = LEAST(GREATEST(p_Posicion, 0), v_Otros);
      UPDATE Workspace t
      JOIN (SELECT Id, ROW_NUMBER() OVER (ORDER BY Posicion, Id) - 1 AS Rn FROM Workspace
            WHERE ClienteId = p_ClienteId AND FechaEliminacion IS NULL AND Id <> v_Id) o ON o.Id = t.Id
      SET t.Posicion = o.Rn + IF(o.Rn >= v_Pos, 1, 0);
      UPDATE Workspace SET Posicion = v_Pos WHERE Id = v_Id;
    END IF;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. Elimina (lógico) el workspace y todo lo que cuelga.
DROP PROCEDURE IF EXISTS `wks_eliminar`$$
CREATE PROCEDURE `wks_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Ahora DATETIME DEFAULT UTC_TIMESTAMP();
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT w.Id INTO v_Id FROM Workspace w
  WHERE w.ClienteId = p_ClienteId AND w.Guid = p_Guid AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Pagina SET FechaEliminacion = v_Ahora WHERE WorkspaceId = v_Id AND FechaEliminacion IS NULL;
    UPDATE Coleccion c JOIN Espacio e ON e.Id = c.EspacioId SET c.FechaEliminacion = v_Ahora
    WHERE e.WorkspaceId = v_Id AND c.FechaEliminacion IS NULL;
    UPDATE Espacio SET FechaEliminacion = v_Ahora WHERE WorkspaceId = v_Id AND FechaEliminacion IS NULL;
    UPDATE Workspace SET FechaEliminacion = v_Ahora WHERE Id = v_Id;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Primer result set: Existe (el workspace existe en el cliente). Segundo: coordinadores y colaboradores no inactivos.
DROP PROCEDURE IF EXISTS `wkm_consultar`$$
CREATE PROCEDURE `wkm_consultar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_WorkspaceGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  SELECT Id INTO v_Id FROM Workspace WHERE ClienteId = p_ClienteId AND Guid = p_WorkspaceGuid AND FechaEliminacion IS NULL;
  SELECT v_Id IS NOT NULL AS Existe;
  SELECT u.Guid, u.Nombre, u.Correo, u.Perfil,
         EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = v_Id AND m.UsuarioId = u.Id) AS Asignado
  FROM Usuario u
  WHERE v_Id IS NOT NULL AND u.ClienteId = p_ClienteId AND u.Perfil IN ('coordinador', 'colaborador') AND u.Estado <> 'inactivo'
  ORDER BY u.Nombre, u.Id;
END$$

-- Resultado: 0 workspace no existe, 1 ok (reemplaza el conjunto), 2 algún guid no es coordinador/colaborador no inactivo del cliente.
-- p_Usuarios: arreglo JSON de guids.
DROP PROCEDURE IF EXISTS `wkm_editar`$$
CREATE PROCEDURE `wkm_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_WorkspaceGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Usuarios JSON)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Invalidos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT Id INTO v_Id FROM Workspace
  WHERE ClienteId = p_ClienteId AND Guid = p_WorkspaceGuid AND FechaEliminacion IS NULL FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    SELECT COUNT(*) INTO v_Invalidos
    FROM JSON_TABLE(p_Usuarios, '$[*]' COLUMNS (UsuarioGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) j
    LEFT JOIN Usuario u ON u.Guid = j.UsuarioGuid AND u.ClienteId = p_ClienteId
      AND u.Perfil IN ('coordinador', 'colaborador') AND u.Estado <> 'inactivo'
    WHERE u.Id IS NULL;
    IF v_Invalidos > 0 THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSE
      DELETE FROM WorkspaceMiembro WHERE WorkspaceId = v_Id;
      INSERT INTO WorkspaceMiembro (WorkspaceId, UsuarioId)
      SELECT DISTINCT v_Id, u.Id
      FROM JSON_TABLE(p_Usuarios, '$[*]' COLUMNS (UsuarioGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$')) j
      JOIN Usuario u ON u.Guid = j.UsuarioGuid AND u.ClienteId = p_ClienteId;
      COMMIT;
      SELECT 1 AS Resultado;
    END IF;
  END IF;
END$$

-- Resultado: 0 el padre no existe o está fuera de alcance, 1 ok (devuelve Guid).
DROP PROCEDURE IF EXISTS `esp_insertar`$$
CREATE PROCEDURE `esp_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_WorkspaceGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Id BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT w.Id INTO v_PadreId FROM Workspace w
  WHERE w.ClienteId = p_ClienteId AND w.Guid = p_WorkspaceGuid AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_PadreId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    INSERT INTO Espacio (ClienteId, WorkspaceId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
    SELECT p_ClienteId, v_PadreId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
    FROM Espacio WHERE WorkspaceId = v_PadreId AND FechaEliminacion IS NULL;
    SET v_Id = LAST_INSERT_ID();
    COMMIT;
    SELECT 1 AS Resultado, Guid FROM Espacio WHERE Id = v_Id;
  END IF;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. p_Posicion: índice 0-based entre hermanos (NULL = no cambia).
DROP PROCEDURE IF EXISTS `esp_editar`$$
CREATE PROCEDURE `esp_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Posicion INT)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Otros INT DEFAULT 0;
  DECLARE v_Pos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT x.Id, x.WorkspaceId INTO v_Id, v_PadreId FROM Espacio x JOIN Workspace w ON w.Id = x.WorkspaceId
  WHERE x.Guid = p_Guid AND x.ClienteId = p_ClienteId AND x.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Espacio SET Nombre = p_Nombre, Slug = p_Slug, Descripcion = p_Descripcion, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Id = v_Id;
    IF p_Posicion IS NOT NULL THEN
      SELECT COUNT(*) INTO v_Otros FROM Espacio WHERE WorkspaceId = v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
      SET v_Pos = LEAST(GREATEST(p_Posicion, 0), v_Otros);
      UPDATE Espacio t
      JOIN (SELECT Id, ROW_NUMBER() OVER (ORDER BY Posicion, Id) - 1 AS Rn FROM Espacio
            WHERE WorkspaceId = v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id) o ON o.Id = t.Id
      SET t.Posicion = o.Rn + IF(o.Rn >= v_Pos, 1, 0);
      UPDATE Espacio SET Posicion = v_Pos WHERE Id = v_Id;
    END IF;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. Elimina (lógico) el elemento y todo lo que cuelga.
DROP PROCEDURE IF EXISTS `esp_eliminar`$$
CREATE PROCEDURE `esp_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Ahora DATETIME DEFAULT UTC_TIMESTAMP();
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT x.Id INTO v_Id FROM Espacio x JOIN Workspace w ON w.Id = x.WorkspaceId
  WHERE x.Guid = p_Guid AND x.ClienteId = p_ClienteId AND x.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Pagina p JOIN Coleccion c ON c.Id = p.ColeccionId SET p.FechaEliminacion = v_Ahora
    WHERE c.EspacioId = v_Id AND p.FechaEliminacion IS NULL;
    UPDATE Coleccion SET FechaEliminacion = v_Ahora WHERE EspacioId = v_Id AND FechaEliminacion IS NULL;
    UPDATE Espacio SET FechaEliminacion = v_Ahora WHERE Id = v_Id;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Resultado: 0 el padre no existe o está fuera de alcance, 1 ok (devuelve Guid).
DROP PROCEDURE IF EXISTS `col_insertar`$$
CREATE PROCEDURE `col_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_EspacioGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Id BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT e.Id INTO v_PadreId FROM Espacio e JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE e.ClienteId = p_ClienteId AND e.Guid = p_EspacioGuid AND e.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_PadreId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    INSERT INTO Coleccion (ClienteId, EspacioId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
    SELECT p_ClienteId, v_PadreId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
    FROM Coleccion WHERE EspacioId = v_PadreId AND FechaEliminacion IS NULL;
    SET v_Id = LAST_INSERT_ID();
    COMMIT;
    SELECT 1 AS Resultado, Guid FROM Coleccion WHERE Id = v_Id;
  END IF;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. p_Posicion: índice 0-based entre hermanos (NULL = no cambia).
DROP PROCEDURE IF EXISTS `col_editar`$$
CREATE PROCEDURE `col_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Posicion INT)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Otros INT DEFAULT 0;
  DECLARE v_Pos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT x.Id, x.EspacioId INTO v_Id, v_PadreId FROM Coleccion x JOIN Espacio e ON e.Id = x.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE x.Guid = p_Guid AND x.ClienteId = p_ClienteId AND x.FechaEliminacion IS NULL AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Coleccion SET Nombre = p_Nombre, Slug = p_Slug, Descripcion = p_Descripcion, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Id = v_Id;
    IF p_Posicion IS NOT NULL THEN
      SELECT COUNT(*) INTO v_Otros FROM Coleccion WHERE EspacioId = v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
      SET v_Pos = LEAST(GREATEST(p_Posicion, 0), v_Otros);
      UPDATE Coleccion t
      JOIN (SELECT Id, ROW_NUMBER() OVER (ORDER BY Posicion, Id) - 1 AS Rn FROM Coleccion
            WHERE EspacioId = v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id) o ON o.Id = t.Id
      SET t.Posicion = o.Rn + IF(o.Rn >= v_Pos, 1, 0);
      UPDATE Coleccion SET Posicion = v_Pos WHERE Id = v_Id;
    END IF;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok. Elimina (lógico) el elemento y todo lo que cuelga.
DROP PROCEDURE IF EXISTS `col_eliminar`$$
CREATE PROCEDURE `col_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Ahora DATETIME DEFAULT UTC_TIMESTAMP();
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT x.Id INTO v_Id FROM Coleccion x JOIN Espacio e ON e.Id = x.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE x.Guid = p_Guid AND x.ClienteId = p_ClienteId AND x.FechaEliminacion IS NULL AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    UPDATE Pagina SET FechaEliminacion = v_Ahora WHERE ColeccionId = v_Id AND FechaEliminacion IS NULL;
    UPDATE Coleccion SET FechaEliminacion = v_Ahora WHERE Id = v_Id;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Resultado: 0 la colección no existe o está fuera de alcance, 1 ok (devuelve Guid),
-- 2 el padre no está en la misma colección o no existe.
DROP PROCEDURE IF EXISTS `pag_insertar`$$
CREATE PROCEDURE `pag_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_ColeccionGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_PaginaPadreGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Titulo VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_ColeccionId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_WorkspaceId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Id BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT c.Id, w.Id INTO v_ColeccionId, v_WorkspaceId
  FROM Coleccion c JOIN Espacio e ON e.Id = c.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
  WHERE c.ClienteId = p_ClienteId AND c.Guid = p_ColeccionGuid AND c.FechaEliminacion IS NULL
    AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_ColeccionId IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    IF p_PaginaPadreGuid IS NOT NULL THEN
      SELECT Id INTO v_PadreId FROM Pagina
      WHERE ClienteId = p_ClienteId AND Guid = p_PaginaPadreGuid AND ColeccionId = v_ColeccionId AND FechaEliminacion IS NULL;
    END IF;
    IF p_PaginaPadreGuid IS NOT NULL AND v_PadreId IS NULL THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSE
      INSERT INTO Pagina (ClienteId, WorkspaceId, ColeccionId, PaginaPadreId, Titulo, Slug, Posicion, CreadoPor, ActualizadoPor)
      SELECT p_ClienteId, v_WorkspaceId, v_ColeccionId, v_PadreId, p_Titulo, p_Slug, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId, p_UsuarioId
      FROM Pagina WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL;
      SET v_Id = LAST_INSERT_ID();
      COMMIT;
      SELECT 1 AS Resultado, Guid FROM Pagina WHERE Id = v_Id;
    END IF;
  END IF;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok, 2 padre inválido (otra colección, inexistente, la propia página o una descendiente).
-- p_PaginaPadreGuid NULL = página raíz de la colección. p_Posicion: índice 0-based entre hermanos (NULL = al final si cambió de padre).
DROP PROCEDURE IF EXISTS `pag_editar`$$
CREATE PROCEDURE `pag_editar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Titulo VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_PaginaPadreGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Posicion INT)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_ColeccionId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreActual BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Desc INT DEFAULT 0;
  DECLARE v_Final INT DEFAULT NULL;
  DECLARE v_Otros INT DEFAULT 0;
  DECLARE v_Pos INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT p.Id, p.ColeccionId, p.PaginaPadreId INTO v_Id, v_ColeccionId, v_PadreActual
  FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    IF p_PaginaPadreGuid IS NOT NULL THEN
      SELECT Id INTO v_PadreId FROM Pagina
      WHERE ClienteId = p_ClienteId AND Guid = p_PaginaPadreGuid AND ColeccionId = v_ColeccionId AND FechaEliminacion IS NULL;
      IF v_PadreId = v_Id THEN
        SET v_Desc = 1;
      ELSEIF v_PadreId IS NOT NULL THEN
        SET v_Desc = (
          WITH RECURSIVE d AS (
            SELECT Id FROM Pagina WHERE PaginaPadreId = v_Id AND FechaEliminacion IS NULL
            UNION ALL
            SELECT h.Id FROM Pagina h JOIN d ON h.PaginaPadreId = d.Id WHERE h.FechaEliminacion IS NULL)
          SELECT COUNT(*) FROM d WHERE d.Id = v_PadreId);
      END IF;
    END IF;
    IF (p_PaginaPadreGuid IS NOT NULL AND v_PadreId IS NULL) OR v_Desc > 0 THEN
      ROLLBACK;
      SELECT 2 AS Resultado;
    ELSE
      IF NOT (v_PadreActual <=> v_PadreId) THEN
        SELECT COALESCE(MAX(Posicion), -1) + 1 INTO v_Final FROM Pagina
        WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
      END IF;
      UPDATE Pagina
      SET Titulo = p_Titulo, Slug = p_Slug, PaginaPadreId = v_PadreId, Posicion = COALESCE(v_Final, Posicion),
          ActualizadoPor = p_UsuarioId, FechaActualizacion = UTC_TIMESTAMP()
      WHERE Id = v_Id;
      IF p_Posicion IS NOT NULL THEN
        SELECT COUNT(*) INTO v_Otros FROM Pagina
        WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
        SET v_Pos = LEAST(GREATEST(p_Posicion, 0), v_Otros);
        UPDATE Pagina t
        JOIN (SELECT Id, ROW_NUMBER() OVER (ORDER BY Posicion, Id) - 1 AS Rn FROM Pagina
              WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id) o ON o.Id = t.Id
        SET t.Posicion = o.Rn + IF(o.Rn >= v_Pos, 1, 0);
        UPDATE Pagina SET Posicion = v_Pos WHERE Id = v_Id;
      END IF;
      COMMIT;
      SELECT 1 AS Resultado;
    END IF;
  END IF;
END$$

-- Resultado: 0 no existe o fuera de alcance, 1 ok, 3 prohibido (p_SoloPropiaSinHijas = 1 y la página es ajena o tiene subpáginas).
-- Elimina (lógico) la página y todas sus descendientes.
DROP PROCEDURE IF EXISTS `pag_eliminar`$$
CREATE PROCEDURE `pag_eliminar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_SoloPropiaSinHijas TINYINT(1))
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_CreadoPor BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_Ahora DATETIME DEFAULT UTC_TIMESTAMP();
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT p.Id, p.CreadoPor INTO v_Id, v_CreadoPor FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  FOR UPDATE;
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSEIF p_SoloPropiaSinHijas = 1 AND (v_CreadoPor <> p_UsuarioId
      OR EXISTS (SELECT 1 FROM Pagina h WHERE h.PaginaPadreId = v_Id AND h.FechaEliminacion IS NULL)) THEN
    ROLLBACK;
    SELECT 3 AS Resultado;
  ELSE
    UPDATE Pagina t
    JOIN (
      WITH RECURSIVE d AS (
        SELECT Id FROM Pagina WHERE Id = v_Id
        UNION ALL
        SELECT h.Id FROM Pagina h JOIN d ON h.PaginaPadreId = d.Id WHERE h.FechaEliminacion IS NULL)
      SELECT Id FROM d) x ON x.Id = t.Id
    SET t.FechaEliminacion = v_Ahora;
    COMMIT;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Result sets: 1) la página con su ubicación (vacío si no existe o fuera de alcance);
-- 2) páginas padre en orden (de la raíz al padre directo); 3) subpáginas directas.
DROP PROCEDURE IF EXISTS `pag_consultarPorGuid`$$
CREATE PROCEDURE `pag_consultarPorGuid`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
  SELECT p.Id, p.PaginaPadreId INTO v_Id, v_PadreId FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));

  SELECT p.Guid, p.Titulo, c.Guid AS ColeccionGuid, c.Nombre AS ColeccionNombre, pp.Guid AS PaginaPadreGuid,
         p.FechaActualizacion, cr.Guid AS CreadoPorGuid,
         w.Guid AS WorkspaceGuid, w.Nombre AS WorkspaceNombre, e.Guid AS EspacioGuid, e.Nombre AS EspacioNombre
  FROM Pagina p
  JOIN Coleccion c ON c.Id = p.ColeccionId
  JOIN Espacio e ON e.Id = c.EspacioId
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Usuario cr ON cr.Id = p.CreadoPor
  LEFT JOIN Pagina pp ON pp.Id = p.PaginaPadreId
  WHERE p.Id = v_Id;

  WITH RECURSIVE a AS (
    SELECT Id, PaginaPadreId, Guid, Titulo, 1 AS Nivel FROM Pagina WHERE Id = v_PadreId
    UNION ALL
    SELECT q.Id, q.PaginaPadreId, q.Guid, q.Titulo, a.Nivel + 1 FROM Pagina q JOIN a ON q.Id = a.PaginaPadreId)
  SELECT Guid, Titulo FROM a ORDER BY Nivel DESC;

  SELECT h.Guid, h.Titulo FROM Pagina h
  WHERE h.PaginaPadreId = v_Id AND h.ClienteId = p_ClienteId AND h.FechaEliminacion IS NULL
  ORDER BY h.Posicion, h.Id;
END$$

DROP PROCEDURE IF EXISTS `pag_consultarRecientes`$$
CREATE PROCEDURE `pag_consultarRecientes`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1))
BEGIN
  SELECT p.Guid, p.Titulo, w.Nombre AS Workspace, c.Nombre AS Coleccion, p.FechaActualizacion
  FROM Pagina p
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Coleccion c ON c.Id = p.ColeccionId
  WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
  ORDER BY p.FechaActualizacion DESC, p.Id DESC
  LIMIT 10;
END$$

-- Igual que la versión anterior; al pasar el perfil a 'admin' (que ve todo) borra sus membresías.
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
      IF p_Perfil = 'admin' THEN
        DELETE FROM WorkspaceMiembro WHERE UsuarioId = v_Id;
      END IF;
      COMMIT;
      SELECT 1 AS Resultado, Guid, Nombre, Correo, Perfil, Estado, FechaCreacion FROM Usuario WHERE Id = v_Id;
    END IF;
  END IF;
END$$

DELIMITER ;

-- REVERSIÓN (descomentar y ejecutar)
-- DROP PROCEDURE IF EXISTS `wks_consultarArbol`;
-- DROP PROCEDURE IF EXISTS `wks_insertar`;
-- DROP PROCEDURE IF EXISTS `wks_editar`;
-- DROP PROCEDURE IF EXISTS `wks_eliminar`;
-- DROP PROCEDURE IF EXISTS `wkm_consultar`;
-- DROP PROCEDURE IF EXISTS `wkm_editar`;
-- DROP PROCEDURE IF EXISTS `esp_insertar`;
-- DROP PROCEDURE IF EXISTS `esp_editar`;
-- DROP PROCEDURE IF EXISTS `esp_eliminar`;
-- DROP PROCEDURE IF EXISTS `col_insertar`;
-- DROP PROCEDURE IF EXISTS `col_editar`;
-- DROP PROCEDURE IF EXISTS `col_eliminar`;
-- DROP PROCEDURE IF EXISTS `pag_insertar`;
-- DROP PROCEDURE IF EXISTS `pag_editar`;
-- DROP PROCEDURE IF EXISTS `pag_eliminar`;
-- DROP PROCEDURE IF EXISTS `pag_consultarPorGuid`;
-- DROP PROCEDURE IF EXISTS `pag_consultarRecientes`;
-- usu_editarPerfilEstado vuelve a su versión anterior re-ejecutando db/Procedimientos/usu_editarPerfilEstado.sql
-- (origen: 2026-10-15_03_usuarios.sql; re-ejecutable).
