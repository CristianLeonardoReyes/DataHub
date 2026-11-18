namespace DataGlobal.DataHub.Common.Const;

/// <summary>
/// Nombres de procedimientos almacenados: &lt;prefijo de tabla&gt;_&lt;verbo&gt;&lt;Calificador&gt;
/// (verbos: insertar, editar, consultar, eliminar). Vive en Common porque Repository no ve Services.
/// </summary>
public static class SpNombres
{
    public const string UsuarioObtenerPorCorreo = "usu_consultarPorCorreo";
    public const string UsuarioObtenerPorGuid = "usu_consultarPorGuid";
    public const string UsuarioRegistrarIntentoFallido = "usu_editarIntentoFallido";
    public const string UsuarioRegistrarLoginExitoso = "usu_editarLoginExitoso";
    public const string UsuarioAceptarInvitacion = "usu_editarAceptarInvitacion";
    public const string UsuarioRestablecerContrasena = "usu_editarContrasena";
    public const string UsuarioTokenCrear = "uto_insertar";
    public const string UsuarioTokenInvalidarPendientes = "uto_editarInvalidarPendientes";
    public const string UsuarioListar = "usu_consultar";
    public const string UsuarioInsertarInvitado = "usu_insertarInvitado";
    public const string UsuarioReenviarInvitacion = "usu_editarReenviarInvitacion";
    public const string UsuarioEditarPerfilEstado = "usu_editarPerfilEstado";
    public const string ClienteListar = "cli_consultar";
    public const string ClienteObtenerPorGuid = "cli_consultarPorGuid";
    public const string ClienteCrearConAdmin = "cli_insertarConAdmin";
    public const string ClienteConsultarOperando = "cli_consultarOperando";
    public const string ClienteActualizar = "cli_editar";
    public const string WorkspaceConsultarArbol = "wks_consultarArbol";
    public const string WorkspaceInsertar = "wks_insertar";
    public const string WorkspaceEditar = "wks_editar";
    public const string WorkspaceEliminar = "wks_eliminar";
    public const string MiembroConsultar = "wkm_consultar";
    public const string MiembroEditar = "wkm_editar";
    public const string EspacioInsertar = "esp_insertar";
    public const string EspacioEditar = "esp_editar";
    public const string EspacioEliminar = "esp_eliminar";
    public const string ColeccionInsertar = "col_insertar";
    public const string ColeccionEditar = "col_editar";
    public const string ColeccionEliminar = "col_eliminar";
    public const string PaginaInsertar = "pag_insertar";
    public const string PaginaEditar = "pag_editar";
    public const string PaginaEliminar = "pag_eliminar";
    public const string PaginaConsultarPorGuid = "pag_consultarPorGuid";
    public const string PaginaConsultarRecientes = "pag_consultarRecientes";
}
