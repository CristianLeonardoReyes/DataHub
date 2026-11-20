-- Mejoras técnicas (2026-11-20). Ejecutar con el cliente mysql (usa DELIMITER).
-- 1. Búsqueda: pag_consultarBusqueda recibe los términos sueltos (p_T1..p_T8, NULL si no hay) y exige que cada
--    uno aparezca (prefijo) en el título O en el contenido; todos son obligatorios. Sustituye a p_Consulta.
--    Cambio de firma: desplegar API y SP juntos.
-- 2. Posición: wks/esp/col/pag_insertar y pag_editar bloquean la fila del padre (FOR UPDATE) antes de calcular
--    MAX(Posicion), para que dos altas simultáneas no obtengan la misma posición.
-- 3. Cliente: nombre único (UQ_Cliente_Nombre, collation 0900_ai_ci: "Café Sur" = "cafe sur"); cli_insertarConAdmin
--    y cli_editar devuelven Resultado 4 si el nombre ya existe.
--
-- ANTES de ejecutar, detectar nombres de cliente repetidos (si devuelve filas, renombrar y repetir):
-- SELECT Nombre, COUNT(*) FROM Cliente GROUP BY Nombre HAVING COUNT(*) > 1;

ALTER TABLE `Cliente` ADD UNIQUE KEY `UQ_Cliente_Nombre` (`Nombre`);

DELIMITER $$

-- Resultado: 1 ok (devuelve ClienteGuid), 2 slug duplicado, 3 correo duplicado, 4 nombre duplicado.
-- GET_LOCK (el mismo que usu_insertarInvitado) serializa las altas de cliente y de usuario: sin él, dos altas simultáneas pasan la validación y chocan en el índice único
-- (clave duplicada o interbloqueo). El bloqueo se toma antes de la transacción y se libera en todos los caminos.
DROP PROCEDURE IF EXISTS `cli_insertarConAdmin`$$
CREATE PROCEDURE `cli_insertarConAdmin`(
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_CorreoAdmin VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Horas INT)
BEGIN
  DECLARE v_ClienteId BIGINT UNSIGNED;
  DECLARE v_UsuarioId BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    DO RELEASE_LOCK('datahub_altas');
    RESIGNAL;
  END;

  -- ponytail: candado global para altas de clientes/invitaciones; si crece el volumen, candado por correo/slug
  IF COALESCE(GET_LOCK('datahub_altas', 15), 0) <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Alta de cliente ocupada.';
  END IF;
  START TRANSACTION;
  IF EXISTS (SELECT 1 FROM Cliente WHERE Slug = p_Slug) THEN
    ROLLBACK;
    DO RELEASE_LOCK('datahub_altas');
    SELECT 2 AS Resultado, NULL AS ClienteGuid;
  ELSEIF EXISTS (SELECT 1 FROM Cliente WHERE Nombre = p_Nombre) THEN
    ROLLBACK;
    DO RELEASE_LOCK('datahub_altas');
    SELECT 4 AS Resultado, NULL AS ClienteGuid;
  ELSEIF EXISTS (SELECT 1 FROM Usuario WHERE Correo = p_CorreoAdmin) THEN
    ROLLBACK;
    DO RELEASE_LOCK('datahub_altas');
    SELECT 3 AS Resultado, NULL AS ClienteGuid;
  ELSE
    INSERT INTO Cliente (Nombre, Slug) VALUES (p_Nombre, p_Slug);
    SET v_ClienteId = LAST_INSERT_ID();
    INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
    VALUES (v_ClienteId, p_CorreoAdmin, p_CorreoAdmin, 'admin', 'invitado');
    SET v_UsuarioId = LAST_INSERT_ID();
    INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
    VALUES (v_UsuarioId, 'invitacion', p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
    COMMIT;
    DO RELEASE_LOCK('datahub_altas');
    SELECT 1 AS Resultado, Guid AS ClienteGuid FROM Cliente WHERE Id = v_ClienteId;
  END IF;
END$$

-- Resultado: 0 no existe, 1 ok, 2 slug duplicado, 4 nombre duplicado.
DROP PROCEDURE IF EXISTS `cli_editar`$$
CREATE PROCEDURE `cli_editar`(
  IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Activo TINYINT(1))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Guid = p_Guid) THEN
    SELECT 0 AS Resultado;
  ELSEIF EXISTS (SELECT 1 FROM Cliente WHERE Slug = p_Slug AND Guid <> p_Guid) THEN
    SELECT 2 AS Resultado;
  ELSEIF EXISTS (SELECT 1 FROM Cliente WHERE Nombre = p_Nombre AND Guid <> p_Guid) THEN
    SELECT 4 AS Resultado;
  ELSE
    UPDATE Cliente
    SET Nombre = p_Nombre, Slug = p_Slug, Activo = p_Activo, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Guid = p_Guid;
    SELECT 1 AS Resultado;
  END IF;
END$$

-- Resultado 1 ok (devuelve Guid). Bloquea la fila Cliente para serializar las altas.
DROP PROCEDURE IF EXISTS `wks_insertar`$$
CREATE PROCEDURE `wks_insertar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  DECLARE v_Id BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT Id INTO v_Id FROM Cliente WHERE Id = p_ClienteId FOR UPDATE;
  INSERT INTO Workspace (ClienteId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
  SELECT p_ClienteId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
  FROM Workspace WHERE ClienteId = p_ClienteId AND FechaEliminacion IS NULL;
  SET v_Id = LAST_INSERT_ID();
  COMMIT;
  SELECT 1 AS Resultado, Guid FROM Workspace WHERE Id = v_Id;
END$$

-- Resultado: 0 el padre no existe o está fuera de alcance, 1 ok (devuelve Guid). Bloquea la fila del padre para serializar las posiciones.
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
    SELECT Id INTO v_PadreId FROM Workspace WHERE Id = v_PadreId FOR UPDATE;
    INSERT INTO Espacio (ClienteId, WorkspaceId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
    SELECT p_ClienteId, v_PadreId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
    FROM Espacio WHERE WorkspaceId = v_PadreId AND FechaEliminacion IS NULL;
    SET v_Id = LAST_INSERT_ID();
    COMMIT;
    SELECT 1 AS Resultado, Guid FROM Espacio WHERE Id = v_Id;
  END IF;
END$$

-- Resultado: 0 el padre no existe o está fuera de alcance, 1 ok (devuelve Guid). Bloquea la fila del padre para serializar las posiciones.
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
    SELECT Id INTO v_PadreId FROM Espacio WHERE Id = v_PadreId FOR UPDATE;
    INSERT INTO Coleccion (ClienteId, EspacioId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
    SELECT p_ClienteId, v_PadreId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
    FROM Coleccion WHERE EspacioId = v_PadreId AND FechaEliminacion IS NULL;
    SET v_Id = LAST_INSERT_ID();
    COMMIT;
    SELECT 1 AS Resultado, Guid FROM Coleccion WHERE Id = v_Id;
  END IF;
END$$


-- Resultado: 0 la colección no existe o está fuera de alcance, 1 ok (devuelve Guid),
-- 2 el padre no está en la misma colección o no existe.
-- Bloquea la fila de la colección para serializar las posiciones.
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
    SELECT Id INTO v_ColeccionId FROM Coleccion WHERE Id = v_ColeccionId FOR UPDATE;
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
-- Bloquea la fila de la colección y luego la página (mismo orden que pag_insertar) para serializar las posiciones.
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
  WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
  IF v_Id IS NULL THEN
    ROLLBACK;
    SELECT 0 AS Resultado;
  ELSE
    SELECT Id INTO v_ColeccionId FROM Coleccion WHERE Id = v_ColeccionId FOR UPDATE;
    SELECT Id, PaginaPadreId INTO v_Id, v_PadreActual FROM Pagina WHERE Id = v_Id FOR UPDATE;
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
        WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id FOR SHARE;
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

-- Cada término no nulo (p_T1..p_T8, ya limpios por la API: solo letras y dígitos) debe aparecer como prefijo en el título
-- o en el contenido; todos son obligatorios. p_Primero es el primer término (para el fragmento).
-- El filtro de alcance va dentro de la consulta. Primer result set: Total. Segundo: la página pedida,
-- por relevancia (título x2) y FechaActualizacion desc.
DROP PROCEDURE IF EXISTS `pag_consultarBusqueda`$$
CREATE PROCEDURE `pag_consultarBusqueda`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_T1 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_T2 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_T3 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_T4 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_T5 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_T6 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_T7 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_T8 VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Primero VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Desplazamiento INT,
  IN p_Limite INT)
BEGIN
  DECLARE v_Q VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  SET v_Q = CONCAT_WS(' ', CONCAT(p_T1, '*'), CONCAT(p_T2, '*'), CONCAT(p_T3, '*'), CONCAT(p_T4, '*'),
                          CONCAT(p_T5, '*'), CONCAT(p_T6, '*'), CONCAT(p_T7, '*'), CONCAT(p_T8, '*'));

  SELECT COUNT(*) AS Total
  FROM Pagina p
  JOIN Workspace w ON w.Id = p.WorkspaceId
  LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
  WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
    AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
    AND (p_T1 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T1, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T1, '*'), '') IN BOOLEAN MODE))
    AND (p_T2 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T2, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T2, '*'), '') IN BOOLEAN MODE))
    AND (p_T3 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T3, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T3, '*'), '') IN BOOLEAN MODE))
    AND (p_T4 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T4, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T4, '*'), '') IN BOOLEAN MODE))
    AND (p_T5 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T5, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T5, '*'), '') IN BOOLEAN MODE))
    AND (p_T6 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T6, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T6, '*'), '') IN BOOLEAN MODE))
    AND (p_T7 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T7, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T7, '*'), '') IN BOOLEAN MODE))
    AND (p_T8 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T8, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T8, '*'), '') IN BOOLEAN MODE));

  SELECT p.Guid, p.Titulo, p.FechaActualizacion, w.Nombre AS Workspace, e.Nombre AS Espacio, c.Nombre AS Coleccion,
         pp.Titulo AS PaginaPadreTitulo,
         CASE WHEN pc.TextoPlano IS NULL THEN ''
              WHEN LOCATE(p_Primero, pc.TextoPlano) = 0 THEN LEFT(pc.TextoPlano, 200)
              ELSE SUBSTRING(pc.TextoPlano, GREATEST(LOCATE(p_Primero, pc.TextoPlano) - 80, 1), 200) END AS Fragmento
  FROM (
    SELECT p.Id,
           MATCH(p.Titulo) AGAINST(v_Q IN BOOLEAN MODE) * 2 + COALESCE(MATCH(pc.TextoPlano) AGAINST(v_Q IN BOOLEAN MODE), 0) AS Puntaje
    FROM Pagina p
    JOIN Workspace w ON w.Id = p.WorkspaceId
    LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
    WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
      AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
      AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
      AND (p_T1 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T1, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T1, '*'), '') IN BOOLEAN MODE))
      AND (p_T2 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T2, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T2, '*'), '') IN BOOLEAN MODE))
      AND (p_T3 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T3, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T3, '*'), '') IN BOOLEAN MODE))
      AND (p_T4 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T4, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T4, '*'), '') IN BOOLEAN MODE))
      AND (p_T5 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T5, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T5, '*'), '') IN BOOLEAN MODE))
      AND (p_T6 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T6, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T6, '*'), '') IN BOOLEAN MODE))
      AND (p_T7 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T7, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T7, '*'), '') IN BOOLEAN MODE))
      AND (p_T8 IS NULL OR MATCH(p.Titulo) AGAINST(COALESCE(CONCAT(p_T8, '*'), '') IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(COALESCE(CONCAT(p_T8, '*'), '') IN BOOLEAN MODE))
    ORDER BY Puntaje DESC, p.FechaActualizacion DESC, p.Id DESC
    LIMIT p_Limite OFFSET p_Desplazamiento
  ) t
  JOIN Pagina p ON p.Id = t.Id
  JOIN Workspace w ON w.Id = p.WorkspaceId
  JOIN Coleccion c ON c.Id = p.ColeccionId
  JOIN Espacio e ON e.Id = c.EspacioId
  LEFT JOIN Pagina pp ON pp.Id = p.PaginaPadreId
  LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
  ORDER BY t.Puntaje DESC, p.FechaActualizacion DESC, p.Id DESC;
END$$

-- Resultado: 1 ok, 3 correo duplicado. Misma serialización que cli_insertarConAdmin.
DROP PROCEDURE IF EXISTS `usu_insertarInvitado`$$
CREATE PROCEDURE `usu_insertarInvitado`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Perfil VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Horas INT)
BEGIN
  DECLARE v_UsuarioId BIGINT UNSIGNED;
  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    ROLLBACK;
    DO RELEASE_LOCK('datahub_altas');
    SELECT 3 AS Resultado;
  END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    DO RELEASE_LOCK('datahub_altas');
    RESIGNAL;
  END;

  -- ponytail: candado global para altas de clientes/invitaciones; si crece el volumen, candado por correo/slug
  IF COALESCE(GET_LOCK('datahub_altas', 15), 0) <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Alta de usuario ocupada.';
  END IF;
  START TRANSACTION;
  IF EXISTS (SELECT 1 FROM Usuario WHERE Correo = p_Correo) THEN
    ROLLBACK;
    DO RELEASE_LOCK('datahub_altas');
    SELECT 3 AS Resultado;
  ELSE
    INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
    VALUES (p_ClienteId, p_Correo, p_Correo, p_Perfil, 'invitado');
    SET v_UsuarioId = LAST_INSERT_ID();
    INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
    VALUES (v_UsuarioId, 'invitacion', p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
    COMMIT;
    DO RELEASE_LOCK('datahub_altas');
    SELECT 1 AS Resultado, Guid, Nombre, Correo, Perfil, Estado, FechaCreacion FROM Usuario WHERE Id = v_UsuarioId;
  END IF;
END$$

DELIMITER ;

-- REVERSIÓN
-- ALTER TABLE `Cliente` DROP INDEX `UQ_Cliente_Nombre`;
-- Restaurar los procedimientos anteriores (versiones de db/Procedimientos al 2026-11-19; el DROP PROCEDURE IF EXISTS de cada uno ya está incluido):
-- DELIMITER $$
-- DROP PROCEDURE IF EXISTS `cli_insertarConAdmin`$$
-- CREATE PROCEDURE `cli_insertarConAdmin`(
--   IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Slug VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_CorreoAdmin VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Horas INT)
-- BEGIN
--   DECLARE v_ClienteId BIGINT UNSIGNED;
--   DECLARE v_UsuarioId BIGINT UNSIGNED;
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--     ROLLBACK;
--     RESIGNAL;
--   END;
-- 
--   START TRANSACTION;
--   IF EXISTS (SELECT 1 FROM Cliente WHERE Slug = p_Slug) THEN
--     ROLLBACK;
--     SELECT 2 AS Resultado, NULL AS ClienteGuid;
--   ELSEIF EXISTS (SELECT 1 FROM Usuario WHERE Correo = p_CorreoAdmin) THEN
--     ROLLBACK;
--     SELECT 3 AS Resultado, NULL AS ClienteGuid;
--   ELSE
--     INSERT INTO Cliente (Nombre, Slug) VALUES (p_Nombre, p_Slug);
--     SET v_ClienteId = LAST_INSERT_ID();
--     INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
--     VALUES (v_ClienteId, p_CorreoAdmin, p_CorreoAdmin, 'admin', 'invitado');
--     SET v_UsuarioId = LAST_INSERT_ID();
--     INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
--     VALUES (v_UsuarioId, 'invitacion', p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
--     COMMIT;
--     SELECT 1 AS Resultado, Guid AS ClienteGuid FROM Cliente WHERE Id = v_ClienteId;
--   END IF;
-- END$$
-- DROP PROCEDURE IF EXISTS `cli_editar`$$
-- CREATE PROCEDURE `cli_editar`(
--   IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Slug VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Activo TINYINT(1))
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Guid = p_Guid) THEN
--     SELECT 0 AS Resultado;
--   ELSEIF EXISTS (SELECT 1 FROM Cliente WHERE Slug = p_Slug AND Guid <> p_Guid) THEN
--     SELECT 2 AS Resultado;
--   ELSE
--     UPDATE Cliente
--     SET Nombre = p_Nombre, Slug = p_Slug, Activo = p_Activo, FechaActualizacion = UTC_TIMESTAMP()
--     WHERE Guid = p_Guid;
--     SELECT 1 AS Resultado;
--   END IF;
-- END$$
-- DROP PROCEDURE IF EXISTS `wks_insertar`$$
-- CREATE PROCEDURE `wks_insertar`(
--   IN p_ClienteId BIGINT UNSIGNED,
--   IN p_UsuarioId BIGINT UNSIGNED,
--   IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
-- BEGIN
--   DECLARE v_Id BIGINT UNSIGNED;
--   INSERT INTO Workspace (ClienteId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
--   SELECT p_ClienteId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
--   FROM Workspace WHERE ClienteId = p_ClienteId AND FechaEliminacion IS NULL;
--   SET v_Id = LAST_INSERT_ID();
--   SELECT 1 AS Resultado, Guid FROM Workspace WHERE Id = v_Id;
-- END$$
-- DROP PROCEDURE IF EXISTS `esp_insertar`$$
-- CREATE PROCEDURE `esp_insertar`(
--   IN p_ClienteId BIGINT UNSIGNED,
--   IN p_UsuarioId BIGINT UNSIGNED,
--   IN p_VeTodo TINYINT(1),
--   IN p_WorkspaceGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
-- BEGIN
--   DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_Id BIGINT UNSIGNED;
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--     ROLLBACK;
--     RESIGNAL;
--   END;
-- 
--   START TRANSACTION;
--   SELECT w.Id INTO v_PadreId FROM Workspace w
--   WHERE w.ClienteId = p_ClienteId AND w.Guid = p_WorkspaceGuid AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
--   IF v_PadreId IS NULL THEN
--     ROLLBACK;
--     SELECT 0 AS Resultado;
--   ELSE
--     INSERT INTO Espacio (ClienteId, WorkspaceId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
--     SELECT p_ClienteId, v_PadreId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
--     FROM Espacio WHERE WorkspaceId = v_PadreId AND FechaEliminacion IS NULL;
--     SET v_Id = LAST_INSERT_ID();
--     COMMIT;
--     SELECT 1 AS Resultado, Guid FROM Espacio WHERE Id = v_Id;
--   END IF;
-- END$$
-- DROP PROCEDURE IF EXISTS `col_insertar`$$
-- CREATE PROCEDURE `col_insertar`(
--   IN p_ClienteId BIGINT UNSIGNED,
--   IN p_UsuarioId BIGINT UNSIGNED,
--   IN p_VeTodo TINYINT(1),
--   IN p_EspacioGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Nombre VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Descripcion VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
-- BEGIN
--   DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_Id BIGINT UNSIGNED;
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--     ROLLBACK;
--     RESIGNAL;
--   END;
-- 
--   START TRANSACTION;
--   SELECT e.Id INTO v_PadreId FROM Espacio e JOIN Workspace w ON w.Id = e.WorkspaceId
--   WHERE e.ClienteId = p_ClienteId AND e.Guid = p_EspacioGuid AND e.FechaEliminacion IS NULL
--     AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
--   IF v_PadreId IS NULL THEN
--     ROLLBACK;
--     SELECT 0 AS Resultado;
--   ELSE
--     INSERT INTO Coleccion (ClienteId, EspacioId, Nombre, Slug, Descripcion, Posicion, CreadoPor)
--     SELECT p_ClienteId, v_PadreId, p_Nombre, p_Slug, p_Descripcion, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId
--     FROM Coleccion WHERE EspacioId = v_PadreId AND FechaEliminacion IS NULL;
--     SET v_Id = LAST_INSERT_ID();
--     COMMIT;
--     SELECT 1 AS Resultado, Guid FROM Coleccion WHERE Id = v_Id;
--   END IF;
-- END$$
-- DROP PROCEDURE IF EXISTS `pag_insertar`$$
-- CREATE PROCEDURE `pag_insertar`(
--   IN p_ClienteId BIGINT UNSIGNED,
--   IN p_UsuarioId BIGINT UNSIGNED,
--   IN p_VeTodo TINYINT(1),
--   IN p_ColeccionGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_PaginaPadreGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Titulo VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
-- BEGIN
--   DECLARE v_ColeccionId BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_WorkspaceId BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_Id BIGINT UNSIGNED;
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--     ROLLBACK;
--     RESIGNAL;
--   END;
-- 
--   START TRANSACTION;
--   SELECT c.Id, w.Id INTO v_ColeccionId, v_WorkspaceId
--   FROM Coleccion c JOIN Espacio e ON e.Id = c.EspacioId JOIN Workspace w ON w.Id = e.WorkspaceId
--   WHERE c.ClienteId = p_ClienteId AND c.Guid = p_ColeccionGuid AND c.FechaEliminacion IS NULL
--     AND e.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId));
--   IF v_ColeccionId IS NULL THEN
--     ROLLBACK;
--     SELECT 0 AS Resultado;
--   ELSE
--     IF p_PaginaPadreGuid IS NOT NULL THEN
--       SELECT Id INTO v_PadreId FROM Pagina
--       WHERE ClienteId = p_ClienteId AND Guid = p_PaginaPadreGuid AND ColeccionId = v_ColeccionId AND FechaEliminacion IS NULL;
--     END IF;
--     IF p_PaginaPadreGuid IS NOT NULL AND v_PadreId IS NULL THEN
--       ROLLBACK;
--       SELECT 2 AS Resultado;
--     ELSE
--       INSERT INTO Pagina (ClienteId, WorkspaceId, ColeccionId, PaginaPadreId, Titulo, Slug, Posicion, CreadoPor, ActualizadoPor)
--       SELECT p_ClienteId, v_WorkspaceId, v_ColeccionId, v_PadreId, p_Titulo, p_Slug, COALESCE(MAX(Posicion), -1) + 1, p_UsuarioId, p_UsuarioId
--       FROM Pagina WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL;
--       SET v_Id = LAST_INSERT_ID();
--       COMMIT;
--       SELECT 1 AS Resultado, Guid FROM Pagina WHERE Id = v_Id;
--     END IF;
--   END IF;
-- END$$
-- DROP PROCEDURE IF EXISTS `pag_editar`$$
-- CREATE PROCEDURE `pag_editar`(
--   IN p_ClienteId BIGINT UNSIGNED,
--   IN p_UsuarioId BIGINT UNSIGNED,
--   IN p_VeTodo TINYINT(1),
--   IN p_Guid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Titulo VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Slug VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_PaginaPadreGuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Posicion INT)
-- BEGIN
--   DECLARE v_Id BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_ColeccionId BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_PadreActual BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_PadreId BIGINT UNSIGNED DEFAULT NULL;
--   DECLARE v_Desc INT DEFAULT 0;
--   DECLARE v_Final INT DEFAULT NULL;
--   DECLARE v_Otros INT DEFAULT 0;
--   DECLARE v_Pos INT DEFAULT 0;
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--     ROLLBACK;
--     RESIGNAL;
--   END;
-- 
--   START TRANSACTION;
--   SELECT p.Id, p.ColeccionId, p.PaginaPadreId INTO v_Id, v_ColeccionId, v_PadreActual
--   FROM Pagina p JOIN Workspace w ON w.Id = p.WorkspaceId
--   WHERE p.Guid = p_Guid AND p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
--   FOR UPDATE;
--   IF v_Id IS NULL THEN
--     ROLLBACK;
--     SELECT 0 AS Resultado;
--   ELSE
--     IF p_PaginaPadreGuid IS NOT NULL THEN
--       SELECT Id INTO v_PadreId FROM Pagina
--       WHERE ClienteId = p_ClienteId AND Guid = p_PaginaPadreGuid AND ColeccionId = v_ColeccionId AND FechaEliminacion IS NULL;
--       IF v_PadreId = v_Id THEN
--         SET v_Desc = 1;
--       ELSEIF v_PadreId IS NOT NULL THEN
--         SET v_Desc = (
--           WITH RECURSIVE d AS (
--             SELECT Id FROM Pagina WHERE PaginaPadreId = v_Id AND FechaEliminacion IS NULL
--             UNION ALL
--             SELECT h.Id FROM Pagina h JOIN d ON h.PaginaPadreId = d.Id WHERE h.FechaEliminacion IS NULL)
--           SELECT COUNT(*) FROM d WHERE d.Id = v_PadreId);
--       END IF;
--     END IF;
--     IF (p_PaginaPadreGuid IS NOT NULL AND v_PadreId IS NULL) OR v_Desc > 0 THEN
--       ROLLBACK;
--       SELECT 2 AS Resultado;
--     ELSE
--       IF NOT (v_PadreActual <=> v_PadreId) THEN
--         SELECT COALESCE(MAX(Posicion), -1) + 1 INTO v_Final FROM Pagina
--         WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
--       END IF;
--       UPDATE Pagina
--       SET Titulo = p_Titulo, Slug = p_Slug, PaginaPadreId = v_PadreId, Posicion = COALESCE(v_Final, Posicion),
--           ActualizadoPor = p_UsuarioId, FechaActualizacion = UTC_TIMESTAMP()
--       WHERE Id = v_Id;
--       IF p_Posicion IS NOT NULL THEN
--         SELECT COUNT(*) INTO v_Otros FROM Pagina
--         WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id;
--         SET v_Pos = LEAST(GREATEST(p_Posicion, 0), v_Otros);
--         UPDATE Pagina t
--         JOIN (SELECT Id, ROW_NUMBER() OVER (ORDER BY Posicion, Id) - 1 AS Rn FROM Pagina
--               WHERE ColeccionId = v_ColeccionId AND PaginaPadreId <=> v_PadreId AND FechaEliminacion IS NULL AND Id <> v_Id) o ON o.Id = t.Id
--         SET t.Posicion = o.Rn + IF(o.Rn >= v_Pos, 1, 0);
--         UPDATE Pagina SET Posicion = v_Pos WHERE Id = v_Id;
--       END IF;
--       COMMIT;
--       SELECT 1 AS Resultado;
--     END IF;
--   END IF;
-- END$$
-- DROP PROCEDURE IF EXISTS `pag_consultarBusqueda`$$
-- CREATE PROCEDURE `pag_consultarBusqueda`(
--   IN p_ClienteId BIGINT UNSIGNED,
--   IN p_UsuarioId BIGINT UNSIGNED,
--   IN p_VeTodo TINYINT(1),
--   IN p_Consulta VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Primero VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Desplazamiento INT,
--   IN p_Limite INT)
-- BEGIN
--   SELECT COUNT(*) AS Total
--   FROM Pagina p
--   JOIN Workspace w ON w.Id = p.WorkspaceId
--   LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
--   WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
--     AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
--     AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
--     AND (MATCH(p.Titulo) AGAINST(p_Consulta IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(p_Consulta IN BOOLEAN MODE));
-- 
--   SELECT p.Guid, p.Titulo, p.FechaActualizacion, w.Nombre AS Workspace, e.Nombre AS Espacio, c.Nombre AS Coleccion,
--          pp.Titulo AS PaginaPadreTitulo,
--          CASE WHEN pc.TextoPlano IS NULL THEN ''
--               WHEN LOCATE(p_Primero, pc.TextoPlano) = 0 THEN LEFT(pc.TextoPlano, 200)
--               ELSE SUBSTRING(pc.TextoPlano, GREATEST(LOCATE(p_Primero, pc.TextoPlano) - 80, 1), 200) END AS Fragmento
--   FROM (
--     SELECT p.Id,
--            MATCH(p.Titulo) AGAINST(p_Consulta IN BOOLEAN MODE) * 2 + COALESCE(MATCH(pc.TextoPlano) AGAINST(p_Consulta IN BOOLEAN MODE), 0) AS Puntaje
--     FROM Pagina p
--     JOIN Workspace w ON w.Id = p.WorkspaceId
--     LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
--     WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
--       AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
--       AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
--       AND (MATCH(p.Titulo) AGAINST(p_Consulta IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(p_Consulta IN BOOLEAN MODE))
--     ORDER BY Puntaje DESC, p.FechaActualizacion DESC, p.Id DESC
--     LIMIT p_Limite OFFSET p_Desplazamiento
--   ) t
--   JOIN Pagina p ON p.Id = t.Id
--   JOIN Workspace w ON w.Id = p.WorkspaceId
--   JOIN Coleccion c ON c.Id = p.ColeccionId
--   JOIN Espacio e ON e.Id = c.EspacioId
--   LEFT JOIN Pagina pp ON pp.Id = p.PaginaPadreId
--   LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
--   ORDER BY t.Puntaje DESC, p.FechaActualizacion DESC, p.Id DESC;
-- END$$
-- DROP PROCEDURE IF EXISTS `usu_insertarInvitado`$$
-- CREATE PROCEDURE `usu_insertarInvitado`(
--   IN p_ClienteId BIGINT UNSIGNED,
--   IN p_Correo VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Perfil VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_TokenHash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
--   IN p_Horas INT)
-- BEGIN
--   DECLARE v_UsuarioId BIGINT UNSIGNED;
--   DECLARE EXIT HANDLER FOR 1062
--   BEGIN
--     ROLLBACK;
--     SELECT 3 AS Resultado;
--   END;
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--     ROLLBACK;
--     RESIGNAL;
--   END;
-- 
--   START TRANSACTION;
--   IF EXISTS (SELECT 1 FROM Usuario WHERE Correo = p_Correo) THEN
--     ROLLBACK;
--     SELECT 3 AS Resultado;
--   ELSE
--     INSERT INTO Usuario (ClienteId, Correo, Nombre, Perfil, Estado)
--     VALUES (p_ClienteId, p_Correo, p_Correo, p_Perfil, 'invitado');
--     SET v_UsuarioId = LAST_INSERT_ID();
--     INSERT INTO UsuarioToken (UsuarioId, Tipo, TokenHash, FechaExpiracion)
--     VALUES (v_UsuarioId, 'invitacion', p_TokenHash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL p_Horas HOUR));
--     COMMIT;
--     SELECT 1 AS Resultado, Guid, Nombre, Correo, Perfil, Estado, FechaCreacion FROM Usuario WHERE Id = v_UsuarioId;
--   END IF;
-- END$$
-- DELIMITER ;
