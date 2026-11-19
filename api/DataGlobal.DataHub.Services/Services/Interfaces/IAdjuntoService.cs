using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IAdjuntoService
{
    Task<IReadOnlyList<AdjuntoDto>> ListarAsync(Guid paginaGuid);
    Task<AdjuntoDto> SubirAsync(Guid paginaGuid, string nombre, string? tipoMime, long tamano, Stream contenido);
    Task<UrlAdjuntoDto> UrlAsync(Guid guid, bool descargar);
    Task EliminarAsync(Guid guid);
}
