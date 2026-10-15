using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Repository.Interfaces;

public interface IUsuarioRepository
{
    Task<UsuarioAuth?> ObtenerPorCorreoAsync(string correo);
    Task<UsuarioAuth?> ObtenerPorGuidAsync(Guid guid);
    Task RegistrarIntentoFallidoAsync(long usuarioId);
    Task RegistrarLoginExitosoAsync(long usuarioId);
    /// <summary>true si aceptó la invitación; false si el token no es válido.</summary>
    Task<bool> AceptarInvitacionAsync(string tokenHash, string nombre, string contrasenaHash);
    /// <summary>true si restableció; false si el token no es válido.</summary>
    Task<bool> RestablecerContrasenaAsync(string tokenHash, string contrasenaHash);
    Task<IReadOnlyList<UsuarioFila>> ListarAsync(long clienteId);
    /// <summary>Resultado 1 ok (fila completa), 3 correo duplicado.</summary>
    Task<UsuarioFila> InsertarInvitadoAsync(long clienteId, string correo, string perfil, string tokenHash, int horas);
    /// <summary>Resultado 0 no existe, 1 ok (Correo), 2 no está invitado.</summary>
    Task<UsuarioFila> ReenviarInvitacionAsync(long clienteId, Guid guid, string tokenHash, int horas);
    /// <summary>Resultado 0 no existe, 1 ok (fila), 2 invitado no se desactiva, 3 Admin sobre sí mismo, 4 último Admin activo.</summary>
    Task<UsuarioFila> EditarPerfilEstadoAsync(long clienteId, long actorId, Guid guid, string perfil, bool activo);
}
