using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Repository.Interfaces;

public interface IPaginaRepository
{
    /// <summary>0 la colección no existe o fuera de alcance, 1 ok, 2 el padre no está en la misma colección.</summary>
    Task<ResultadoCrear> InsertarAsync(Alcance a, Guid coleccionGuid, Guid? paginaPadreGuid, string titulo, string slug);
    /// <summary>0 no existe o fuera de alcance, 1 ok, 2 padre inválido (otra colección, ella misma o una descendiente).</summary>
    Task<int> EditarAsync(Alcance a, Guid guid, string titulo, string slug, Guid? paginaPadreGuid, int? posicion);
    /// <summary>0 no existe o fuera de alcance, 1 ok, 3 prohibido (solo propia y sin subpáginas).</summary>
    Task<int> EliminarAsync(Alcance a, Guid guid, bool soloPropiaSinHijas);
    Task<PaginaDetalleFilas?> ObtenerAsync(Alcance a, Guid guid);
    Task<IReadOnlyList<PaginaRecienteDto>> RecientesAsync(Alcance a);
}
