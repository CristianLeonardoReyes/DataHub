-- Estado vigente. Origen: Migraciones/2026-11-19_01_metadata_etiquetas.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `eti_consultar`$$
CREATE PROCEDURE `eti_consultar`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_Texto VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci)
BEGIN
  SELECT Nombre FROM Etiqueta
  WHERE ClienteId = p_ClienteId
    AND (p_Texto = '' OR LEFT(Nombre, CHAR_LENGTH(p_Texto)) = p_Texto)
  ORDER BY Nombre
  LIMIT 10;
END$$

DELIMITER ;
