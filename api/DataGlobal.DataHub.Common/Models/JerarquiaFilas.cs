namespace DataGlobal.DataHub.Common.Models;

/// <summary>Fila de resultado de los SP de inserción de jerarquía: 0 no existe/fuera de alcance, 1 ok, 2 dato inválido.</summary>
public class ResultadoCrear
{
    public int Resultado { get; set; }
    public Guid? Guid { get; set; }
}

/// <summary>Quién consulta y qué alcance tiene: VeTodo = Super admin / Admin; el resto, solo sus workspaces asignados.</summary>
public record Alcance(long ClienteId, long UsuarioId, bool VeTodo);

public class WorkspaceFila { public Guid Guid { get; set; } public string Nombre { get; set; } = ""; public string? Descripcion { get; set; } }
public class EspacioFila { public Guid WorkspaceGuid { get; set; } public Guid Guid { get; set; } public string Nombre { get; set; } = ""; public string? Descripcion { get; set; } }
public class ColeccionFila { public Guid EspacioGuid { get; set; } public Guid Guid { get; set; } public string Nombre { get; set; } = ""; public string? Descripcion { get; set; } }
public class PaginaFila { public Guid ColeccionGuid { get; set; } public Guid? PaginaPadreGuid { get; set; } public Guid Guid { get; set; } public string Titulo { get; set; } = ""; }

public record ArbolFilas(IReadOnlyList<WorkspaceFila> Workspaces, IReadOnlyList<EspacioFila> Espacios,
    IReadOnlyList<ColeccionFila> Colecciones, IReadOnlyList<PaginaFila> Paginas);

public class MiembroFila
{
    public Guid Guid { get; set; }
    public string Nombre { get; set; } = "";
    public string Correo { get; set; } = "";
    public string Perfil { get; set; } = "";
    public bool Asignado { get; set; }
}

/// <summary>Miembros del workspace: Existe indica si el workspace existe en el cliente.</summary>
public record MiembrosFilas(bool Existe, IReadOnlyList<MiembroFila> Miembros);

/// <summary>Primera fila de pag_consultarPorGuid (con su ubicación).</summary>
public class PaginaDetalleFila
{
    public Guid Guid { get; set; }
    public string Titulo { get; set; } = "";
    public Guid ColeccionGuid { get; set; }
    public string ColeccionNombre { get; set; } = "";
    public Guid? PaginaPadreGuid { get; set; }
    public DateTime FechaActualizacion { get; set; }
    public Guid CreadoPorGuid { get; set; }
    public Guid WorkspaceGuid { get; set; }
    public string WorkspaceNombre { get; set; } = "";
    public Guid EspacioGuid { get; set; }
    public string EspacioNombre { get; set; } = "";
}

public class PaginaPadreFila { public Guid Guid { get; set; } public string Titulo { get; set; } = ""; }

public record PaginaDetalleFilas(PaginaDetalleFila Pagina, IReadOnlyList<PaginaPadreFila> Padres, IReadOnlyList<PaginaPadreFila> Hijas);
