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

    public Task<IReadOnlyList<UsuarioFila>> ListarAsync(long clienteId) =>
        QueryListAsync<UsuarioFila>(SpNombres.UsuarioListar, new { p_ClienteId = clienteId });

    public async Task<UsuarioFila> InsertarInvitadoAsync(long clienteId, string correo, string perfil, string tokenHash, int horas) =>
        (await QueryFirstOrNullAsync<UsuarioFila>(SpNombres.UsuarioInsertarInvitado,
            new { p_ClienteId = clienteId, p_Correo = correo, p_Perfil = perfil, p_TokenHash = tokenHash, p_Horas = horas }))!;

    public async Task<UsuarioFila> ReenviarInvitacionAsync(long clienteId, Guid guid, string tokenHash, int horas) =>
        (await QueryFirstOrNullAsync<UsuarioFila>(SpNombres.UsuarioReenviarInvitacion,
            new { p_ClienteId = clienteId, p_Guid = guid, p_TokenHash = tokenHash, p_Horas = horas }))!;

    public async Task<UsuarioFila> EditarPerfilEstadoAsync(long clienteId, long actorId, Guid guid, string perfil, bool activo) =>
        (await QueryFirstOrNullAsync<UsuarioFila>(SpNombres.UsuarioEditarPerfilEstado,
            new { p_ClienteId = clienteId, p_ActorId = actorId, p_Guid = guid, p_Perfil = perfil, p_Activo = activo }))!;
}
