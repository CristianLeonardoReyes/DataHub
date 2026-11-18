using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Repository.Interfaces;

public interface IWorkspaceRepository
{
    Task<ArbolFilas> ArbolAsync(Alcance a);
    Task<ResultadoCrear> InsertarAsync(Alcance a, string nombre, string slug, string? descripcion);
    /// <summary>0 no existe o fuera de alcance, 1 ok.</summary>
    Task<int> EditarAsync(Alcance a, Guid guid, string nombre, string slug, string? descripcion, int? posicion);
    /// <summary>0 no existe o fuera de alcance, 1 ok.</summary>
    Task<int> EliminarAsync(Alcance a, Guid guid);
    Task<MiembrosFilas> MiembrosAsync(long clienteId, Guid workspaceGuid);
    /// <summary>0 el workspace no existe, 1 ok, 2 algún usuario no es coordinador/colaborador del cliente.</summary>
    Task<int> AsignarMiembrosAsync(long clienteId, Guid workspaceGuid, string usuariosJson);
}
