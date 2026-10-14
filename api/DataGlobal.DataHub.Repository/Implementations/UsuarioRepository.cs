using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class UsuarioRepository(DapperContext context) : BaseRepository(context), IUsuarioRepository
{
    public Task<UsuarioAuth?> ObtenerPorCorreoAsync(string correo) =>
        QueryFirstOrNullAsync<UsuarioAuth>(SpNombres.UsuarioObtenerPorCorreo, new { p_Correo = correo });

    public Task<UsuarioAuth?> ObtenerPorGuidAsync(Guid guid) =>
        QueryFirstOrNullAsync<UsuarioAuth>(SpNombres.UsuarioObtenerPorGuid, new { p_Guid = guid });

    public Task RegistrarIntentoFallidoAsync(long usuarioId) =>
        ExecuteAsync(SpNombres.UsuarioRegistrarIntentoFallido, new { p_UsuarioId = usuarioId });

    public Task RegistrarLoginExitosoAsync(long usuarioId) =>
        ExecuteAsync(SpNombres.UsuarioRegistrarLoginExitoso, new { p_UsuarioId = usuarioId });

    public async Task<bool> AceptarInvitacionAsync(string tokenHash, string nombre, string contrasenaHash) =>
        await ExecuteScalarAsync<int>(SpNombres.UsuarioAceptarInvitacion,
            new { p_TokenHash = tokenHash, p_Nombre = nombre, p_ContrasenaHash = contrasenaHash }) == 1;

    public async Task<bool> RestablecerContrasenaAsync(string tokenHash, string contrasenaHash) =>
        await ExecuteScalarAsync<int>(SpNombres.UsuarioRestablecerContrasena,
            new { p_TokenHash = tokenHash, p_ContrasenaHash = contrasenaHash }) == 1;
}
