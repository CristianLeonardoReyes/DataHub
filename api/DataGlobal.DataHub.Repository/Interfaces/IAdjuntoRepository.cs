using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Repository.Interfaces;

public interface IAdjuntoRepository
{
    /// <summary>0 página fuera de alcance, 1 ok.</summary>
    Task<int> InsertarAsync(Alcance a, Guid paginaGuid, Guid guid, string nombre, string rutaBlob, string tipoMime, long tamanoBytes);
    Task<AdjuntosPaginaFilas> ConsultarPorPaginaAsync(Alcance a, Guid paginaGuid);
    /// <summary>Null si no existe, está eliminado o fuera de alcance.</summary>
    Task<AdjuntoRutaFila?> ConsultarPorGuidAsync(Alcance a, Guid guid);
    /// <summary>0 no existe o fuera de alcance, 1 ok, 3 prohibido (solo propio y el adjunto es ajeno).</summary>
    Task<int> EliminarAsync(Alcance a, Guid guid, bool soloPropio);
}
