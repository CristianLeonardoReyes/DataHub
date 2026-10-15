using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IUsuarioService
{
    Task<IReadOnlyList<UsuarioDto>> ListarAsync();
    Task<UsuarioDto> InvitarAsync(InvitarUsuarioRequest solicitud);
    Task ReenviarInvitacionAsync(Guid guid);
    Task<UsuarioDto> ActualizarAsync(Guid guid, ActualizarUsuarioRequest solicitud);
}
