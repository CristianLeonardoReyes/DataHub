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
}
