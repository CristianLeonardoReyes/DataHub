-- Estado vigente. Origen: Migraciones/2026-10-15_02_clientes.sql

DELIMITER $$

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
  ELSE
    UPDATE Cliente
    SET Nombre = p_Nombre, Slug = p_Slug, Activo = p_Activo, FechaActualizacion = UTC_TIMESTAMP()
    WHERE Guid = p_Guid;
    SELECT 1 AS Resultado;
  END IF;
END$$

DELIMITER ;
