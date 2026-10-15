using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IClienteService
{
    Task<IReadOnlyList<ClienteDto>> ListarAsync();
    Task<ClienteDto> ObtenerAsync(Guid guid);
    Task<ClienteDto> CrearAsync(CrearClienteRequest solicitud);
    Task<ClienteDto> ActualizarAsync(Guid guid, ActualizarClienteRequest solicitud);
}
