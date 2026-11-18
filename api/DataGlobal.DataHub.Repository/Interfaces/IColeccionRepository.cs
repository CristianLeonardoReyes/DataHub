using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Repository.Interfaces;

public interface IColeccionRepository
{
    /// <summary>0 el espacio no existe o está fuera de alcance, 1 ok.</summary>
    Task<ResultadoCrear> InsertarAsync(Alcance a, Guid espacioGuid, string nombre, string slug, string? descripcion);
    /// <summary>0 no existe o fuera de alcance, 1 ok.</summary>
    Task<int> EditarAsync(Alcance a, Guid guid, string nombre, string slug, string? descripcion, int? posicion);
    /// <summary>0 no existe o fuera de alcance, 1 ok. Elimina también lo que cuelga.</summary>
    Task<int> EliminarAsync(Alcance a, Guid guid);
}
