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
    /// <summary>0 no existe o fuera de alcance, 1 ok, 2 responsable no válido, 3 sin permiso para aprobar.</summary>
    Task<int> EditarMetadataAsync(Alcance a, Guid guid, string estado, string tipoDocumento, Guid? responsableGuid,
        DateOnly? fechaRevision, string etiquetasJson, bool puedeAprobar);
    Task<IReadOnlyList<string>> ConsultarEtiquetasAsync(Alcance a, string texto);
    Task<IReadOnlyList<ResponsableDto>> ConsultarResponsablesAsync(Alcance a);
    Task<IReadOnlyList<PaginaRecienteDto>> RecientesAsync(Alcance a);
    /// <summary>Total de coincidencias y la página pedida; el alcance se filtra dentro del SP.</summary>
    Task<BusquedaFilas> BuscarAsync(Alcance a, string consulta, string primero, int desplazamiento, int limite);
    /// <summary>Resultado 0 fuera de alcance, 1 ok (ContenidoJson null y versión 0 si aún no hay contenido).</summary>
    Task<ContenidoFila> ObtenerContenidoAsync(Alcance a, Guid guid);
    /// <summary>0 fuera de alcance, 1 ok (versión nueva), 2 conflicto de versión (versión guardada).</summary>
    Task<ResultadoContenido> GuardarContenidoAsync(Alcance a, Guid guid, string contenidoJson, string textoPlano, int version);
}
