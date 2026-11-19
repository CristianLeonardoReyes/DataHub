-- Módulo 8: búsqueda de páginas por título y contenido (PRD §4.8). Ejecutar con el cliente mysql (usa DELIMITER).
-- Índices FULLTEXT (parser por defecto) en Pagina.Titulo y PaginaContenido.TextoPlano.
-- pag_consultarBusqueda: el filtro de alcance va dentro de la consulta (cliente, página y workspace no eliminados,
-- p_VeTodo = 1 o el usuario es miembro del workspace). p_Consulta llega ya preparada para BOOLEAN MODE por la API;
-- p_Primero es el primer término sin operadores (para el fragmento).
-- Primer result set: Total de coincidencias. Segundo: la página pedida, por relevancia (título x2) y FechaActualizacion desc.
-- Nota: los índices FULLTEXT de InnoDB solo ven filas confirmadas.

ALTER TABLE `Pagina` ADD FULLTEXT INDEX `FT_Pagina_Titulo` (`Titulo`);
ALTER TABLE `PaginaContenido` ADD FULLTEXT INDEX `FT_PaginaContenido_TextoPlano` (`TextoPlano`);

DELIMITER $$

DROP PROCEDURE IF EXISTS `pag_consultarBusqueda`$$
CREATE PROCEDURE `pag_consultarBusqueda`(
  IN p_ClienteId BIGINT UNSIGNED,
  IN p_UsuarioId BIGINT UNSIGNED,
  IN p_VeTodo TINYINT(1),
  IN p_Consulta VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Primero VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN p_Desplazamiento INT,
  IN p_Limite INT)
BEGIN
  SELECT COUNT(*) AS Total
  FROM Pagina p
  JOIN Workspace w ON w.Id = p.WorkspaceId
  LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
  WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
    AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
    AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
    AND (MATCH(p.Titulo) AGAINST(p_Consulta IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(p_Consulta IN BOOLEAN MODE));

  SELECT p.Guid, p.Titulo, p.FechaActualizacion, w.Nombre AS Workspace, e.Nombre AS Espacio, c.Nombre AS Coleccion,
         pp.Titulo AS PaginaPadreTitulo,
         CASE WHEN pc.TextoPlano IS NULL THEN ''
              WHEN LOCATE(p_Primero, pc.TextoPlano) = 0 THEN LEFT(pc.TextoPlano, 200)
              ELSE SUBSTRING(pc.TextoPlano, GREATEST(LOCATE(p_Primero, pc.TextoPlano) - 80, 1), 200) END AS Fragmento
  FROM (
    SELECT p.Id,
           MATCH(p.Titulo) AGAINST(p_Consulta IN BOOLEAN MODE) * 2 + COALESCE(MATCH(pc.TextoPlano) AGAINST(p_Consulta IN BOOLEAN MODE), 0) AS Puntaje
    FROM Pagina p
    JOIN Workspace w ON w.Id = p.WorkspaceId
    LEFT JOIN PaginaContenido pc ON pc.PaginaId = p.Id
    WHERE p.ClienteId = p_ClienteId AND p.FechaEliminacion IS NULL
      AND w.ClienteId = p_ClienteId AND w.FechaEliminacion IS NULL
      AND (p_VeTodo = 1 OR EXISTS (SELECT 1 FROM WorkspaceMiembro m WHERE m.WorkspaceId = w.Id AND m.UsuarioId = p_UsuarioId))
      AND (MATCH(p.Titulo) AGAINST(p_Consulta IN BOOLEAN MODE) OR MATCH(pc.TextoPlano) AGAINST(p_Consulta IN BOOLEAN MODE))
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

DELIMITER ;

-- REVERSIÓN
-- DROP PROCEDURE IF EXISTS `pag_consultarBusqueda`;
-- ALTER TABLE `PaginaContenido` DROP INDEX `FT_PaginaContenido_TextoPlano`;
-- ALTER TABLE `Pagina` DROP INDEX `FT_Pagina_Titulo`;
