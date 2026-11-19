using System.Text.Json;

namespace DataGlobal.DataHub.Common.DTOs;

/// <summary>Contenido Tiptap de una página. Contenido es null si aún no se ha guardado (Version 0).</summary>
public record ContenidoPaginaDto(JsonElement? Contenido, int Version);

public class GuardarContenidoRequest
{
    /// <summary>Documento Tiptap: objeto con type "doc". Máximo 2 MB.</summary>
    public JsonElement Contenido { get; set; }
    /// <summary>Versión que el cliente leyó (0 si la página no tenía contenido). Si no coincide con la guardada, 409.</summary>
    public int Version { get; set; }
}

public record VersionContenidoDto(int Version);

/// <summary>Resultado interno de la exportación: no se serializa como JSON.</summary>
public record ArchivoMarkdownDto(string NombreArchivo, string Contenido);
