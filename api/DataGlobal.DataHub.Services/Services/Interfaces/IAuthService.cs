using System.Security.Claims;
using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IAuthService
{
    /// <summary>null si las credenciales no son válidas (cualquier motivo).</summary>
    Task<Sesion?> LoginAsync(LoginRequest solicitud);
    /// <summary>Usuario existente y activo, o null. Se usa en cada petición autenticada.</summary>
    Task<UsuarioAuth?> ObtenerActivoAsync(Guid guid);
    /// <summary>Cliente activo (para el Super admin operando) o null si no existe o está inactivo.</summary>
    Task<ClienteOperando?> ObtenerClienteActivoAsync(Guid guid);
    /// <summary>Solo Super admin. Re-emite la sesión con el cliente indicado (o sin cliente) y la misma expiración y los mismos max/rec del token.</summary>
    Task<Sesion> CambiarClienteOperandoAsync(Guid? clienteGuid, DateTime expira, ClaimsPrincipal principal);
    /// <summary>Sesión nueva si al token le queda menos de la mitad de su ventana y no llegó a su máximo; si no, null.</summary>
    Sesion? RenovarSiCorresponde(ClaimsPrincipal principal);
    Task AceptarInvitacionAsync(AceptarInvitacionRequest solicitud);
    Task OlvideContrasenaAsync(string correo);
    Task RestablecerContrasenaAsync(RestablecerContrasenaRequest solicitud);
}
