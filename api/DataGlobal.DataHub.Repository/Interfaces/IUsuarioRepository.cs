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
}
