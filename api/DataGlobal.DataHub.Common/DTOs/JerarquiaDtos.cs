using System.ComponentModel.DataAnnotations;
using DataGlobal.DataHub.Common.Enums;

namespace DataGlobal.DataHub.Common.DTOs;

public record PaginaArbolDto(Guid Guid, string Titulo, IReadOnlyList<PaginaArbolDto> Paginas);
public record ColeccionArbolDto(Guid Guid, string Nombre, string? Descripcion, IReadOnlyList<PaginaArbolDto> Paginas);
public record EspacioArbolDto(Guid Guid, string Nombre, string? Descripcion, IReadOnlyList<ColeccionArbolDto> Colecciones);
public record WorkspaceArbolDto(Guid Guid, string Nombre, string? Descripcion, IReadOnlyList<EspacioArbolDto> Espacios);

public record CreadoDto(Guid Guid);

public record MiembroDto(Guid Guid, string Nombre, string Correo, PerfilUsuario Perfil, bool Asignado);

public record RutaItemDto(string Tipo, Guid Guid, string Nombre);
public record SubpaginaDto(Guid Guid, string Titulo);
public record ResponsableDto(Guid Guid, string Nombre);
/// <summary>Estado: borrador | en_revision | aprobado | archivado. TipoDocumento: general | adr | api | runbook | arquitectura | onboarding | guia | procedimiento | manual | acta.</summary>
public record PaginaDetalleDto(Guid Guid, string Titulo, Guid ColeccionGuid, Guid? PaginaPadreGuid, DateTime FechaActualizacion,
    bool PuedeEliminar, IReadOnlyList<RutaItemDto> Ruta, IReadOnlyList<SubpaginaDto> Subpaginas,
    string Estado, string TipoDocumento, ResponsableDto? Responsable, DateOnly? FechaRevision, IReadOnlyList<string> Etiquetas, bool PuedeAprobar);
public record PaginaRecienteDto(Guid Guid, string Titulo, string Workspace, string Coleccion, DateTime FechaActualizacion);

public class CrearWorkspaceRequest
{
    /// <summary>1 a 150 caracteres.</summary>
    [Required, MaxLength(150)] public string Nombre { get; set; } = "";
    [MaxLength(500)] public string? Descripcion { get; set; }
}

public class CrearEspacioRequest
{
    public Guid WorkspaceGuid { get; set; }
    [Required, MaxLength(150)] public string Nombre { get; set; } = "";
    [MaxLength(500)] public string? Descripcion { get; set; }
}

public class CrearColeccionRequest
{
    public Guid EspacioGuid { get; set; }
    [Required, MaxLength(150)] public string Nombre { get; set; } = "";
    [MaxLength(500)] public string? Descripcion { get; set; }
}

/// <summary>Edición de workspace, espacio o colección.</summary>
public class ActualizarElementoRequest
{
    [Required, MaxLength(150)] public string Nombre { get; set; } = "";
    [MaxLength(500)] public string? Descripcion { get; set; }
    /// <summary>Índice 0-based entre sus hermanos; si se omite, no cambia el orden.</summary>
    [Range(0, int.MaxValue)] public int? Posicion { get; set; }
}

public class AsignarMiembrosRequest
{
    /// <summary>Guids de los coordinadores y colaboradores asignados; reemplaza el conjunto actual.</summary>
    [Required] public List<Guid> Usuarios { get; set; } = [];
}

public class CrearPaginaRequest
{
    public Guid ColeccionGuid { get; set; }
    public Guid? PaginaPadreGuid { get; set; }
    /// <summary>1 a 200 caracteres.</summary>
    [Required, MaxLength(200)] public string Titulo { get; set; } = "";
}

/// <summary>Reemplaza toda la metadata: responsable/fecha null los quitan y etiquetas vacías quitan las etiquetas.</summary>
public class EditarMetadataRequest
{
    /// <summary>borrador | en_revision | aprobado | archivado. Pasar a aprobado: Coordinador o superior.</summary>
    [Required] public string Estado { get; set; } = "";
    /// <summary>general | adr | api | runbook | arquitectura | onboarding | guia | procedimiento | manual | acta.</summary>
    [Required] public string TipoDocumento { get; set; } = "";
    /// <summary>Usuario activo del cliente; null = sin responsable.</summary>
    public Guid? ResponsableGuid { get; set; }
    public DateOnly? FechaRevision { get; set; }
    /// <summary>Hasta 20 etiquetas de 1 a 50 caracteres; se normalizan (minúsculas, espacios colapsados, sin duplicados).</summary>
    public List<string>? Etiquetas { get; set; }
}

public class ActualizarPaginaRequest
{
    [Required, MaxLength(200)] public string Titulo { get; set; } = "";
    /// <summary>Página padre dentro de la misma colección; vacío = raíz de la colección.</summary>
    public Guid? PaginaPadreGuid { get; set; }
    /// <summary>Índice 0-based entre sus hermanas; si se omite, no cambia (al final si cambió de padre).</summary>
    [Range(0, int.MaxValue)] public int? Posicion { get; set; }
}
