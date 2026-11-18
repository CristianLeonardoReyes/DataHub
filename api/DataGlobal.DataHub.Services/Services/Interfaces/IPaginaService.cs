using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IPaginaService
{
    Task<IReadOnlyList<PaginaRecienteDto>> RecientesAsync();
    Task<PaginaDetalleDto> ObtenerAsync(Guid guid);
    Task<Guid> CrearAsync(CrearPaginaRequest solicitud);
    Task ActualizarAsync(Guid guid, ActualizarPaginaRequest solicitud);
    Task EliminarAsync(Guid guid);
    Task<ContenidoPaginaDto> ObtenerContenidoAsync(Guid guid);
    Task<VersionContenidoDto> GuardarContenidoAsync(Guid guid, GuardarContenidoRequest solicitud);
}
