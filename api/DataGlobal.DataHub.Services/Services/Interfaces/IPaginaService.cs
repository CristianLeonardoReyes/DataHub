using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IPaginaService
{
    Task<IReadOnlyList<PaginaRecienteDto>> RecientesAsync();
    Task<BusquedaDto> BuscarAsync(string? q, int pagina);
    Task<PaginaDetalleDto> ObtenerAsync(Guid guid);
    Task EditarMetadataAsync(Guid guid, EditarMetadataRequest solicitud);
    Task<IReadOnlyList<string>> EtiquetasAsync(string? texto);
    Task<IReadOnlyList<ResponsableDto>> ResponsablesAsync();
    Task<Guid> CrearAsync(CrearPaginaRequest solicitud);
    Task ActualizarAsync(Guid guid, ActualizarPaginaRequest solicitud);
    Task EliminarAsync(Guid guid);
    Task<ContenidoPaginaDto> ObtenerContenidoAsync(Guid guid);
    /// <summary>Markdown con Front Matter y nombre de archivo {slug}.md.</summary>
    Task<ArchivoMarkdownDto> ExportarMarkdownAsync(Guid guid);
    Task<VersionContenidoDto> GuardarContenidoAsync(Guid guid, GuardarContenidoRequest solicitud);
}
