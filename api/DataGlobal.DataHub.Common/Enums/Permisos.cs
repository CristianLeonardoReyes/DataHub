using System.Text.Json;
using System.Text.Json.Serialization;

namespace DataGlobal.DataHub.Common.Enums;

/// <summary>Perfiles fijos (PRD 3.1). El valor serializado es el mismo que guarda Usuario.Perfil.</summary>
[JsonConverter(typeof(JsonStringEnumConverter<PerfilUsuario>))]
public enum PerfilUsuario
{
    [JsonStringEnumMemberName("super_admin")] SuperAdmin,
    [JsonStringEnumMemberName("admin")] Admin,
    [JsonStringEnumMemberName("coordinador")] Coordinador,
    [JsonStringEnumMemberName("colaborador")] Colaborador
}

/// <summary>Una fila de la matriz de permisos (PRD 3.2). El orden es el de la tabla.</summary>
public enum Accion
{
    ClientesGestionar,
    UsuariosGestionar,
    WorkspacesAsignarUsuarios,
    WorkspacesGestionar,
    EspaciosColeccionesGestionar,
    PaginasEditar,
    PaginasEliminar,
    MetadataEditar,
    PaginasAprobar,
    ArchivosGestionar,
    ArchivosEliminar,
    Buscar,
    ExportarMarkdown
}

public static class MatrizPermisos
{
    private static readonly Accion[] Todas = Enum.GetValues<Accion>();

    private static readonly Dictionary<PerfilUsuario, Accion[]> PorPerfil = new()
    {
        [PerfilUsuario.SuperAdmin] = Todas,
        [PerfilUsuario.Admin] = [.. Todas.Where(a => a != Accion.ClientesGestionar)],
        [PerfilUsuario.Coordinador] = [.. Todas.Where(a => a >= Accion.EspaciosColeccionesGestionar)],
        [PerfilUsuario.Colaborador] =
        [
            Accion.PaginasEditar, Accion.PaginasEliminar, Accion.MetadataEditar,
            Accion.ArchivosGestionar, Accion.ArchivosEliminar, Accion.Buscar, Accion.ExportarMarkdown
        ]
    };

    public static IReadOnlyList<Accion> De(PerfilUsuario perfil) => PorPerfil[perfil];

    /// <summary>"super_admin" | "admin" | "coordinador" | "colaborador" (valor de Usuario.Perfil).</summary>
    public static PerfilUsuario ParsearPerfil(string perfil) => perfil switch
    {
        "super_admin" => PerfilUsuario.SuperAdmin,
        "admin" => PerfilUsuario.Admin,
        "coordinador" => PerfilUsuario.Coordinador,
        "colaborador" => PerfilUsuario.Colaborador,
        _ => throw new ArgumentOutOfRangeException(nameof(perfil), "Perfil desconocido.")
    };

    /// <summary>Formato de la acción en la API: camelCase del nombre (p. ej. clientesGestionar).</summary>
    public static string Nombre(Accion a) => JsonNamingPolicy.CamelCase.ConvertName(a.ToString());
}
