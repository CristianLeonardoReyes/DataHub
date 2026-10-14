namespace DataGlobal.DataHub.Common.Const;

/// <summary>Nombres de procedimientos almacenados. Vive en Common porque Repository no ve Services.</summary>
public static class SpNombres
{
    public const string UsuarioObtenerPorCorreo = "sp_Usuario_ObtenerPorCorreo";
    public const string UsuarioObtenerPorGuid = "sp_Usuario_ObtenerPorGuid";
    public const string UsuarioRegistrarIntentoFallido = "sp_Usuario_RegistrarIntentoFallido";
    public const string UsuarioRegistrarLoginExitoso = "sp_Usuario_RegistrarLoginExitoso";
    public const string UsuarioAceptarInvitacion = "sp_Usuario_AceptarInvitacion";
    public const string UsuarioRestablecerContrasena = "sp_Usuario_RestablecerContrasena";
    public const string UsuarioTokenCrear = "sp_UsuarioToken_Crear";
    public const string UsuarioTokenInvalidarPendientes = "sp_UsuarioToken_InvalidarPendientes";
}
