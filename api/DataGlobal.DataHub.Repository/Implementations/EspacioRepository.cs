using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class EspacioRepository(DapperContext context) : BaseRepository(context), IEspacioRepository
{
    public async Task<ResultadoCrear> InsertarAsync(Alcance a, Guid workspaceGuid, string nombre, string slug, string? descripcion) =>
        (await QueryFirstOrNullAsync<ResultadoCrear>(SpNombres.EspacioInsertar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_WorkspaceGuid = workspaceGuid,
                  p_Nombre = nombre, p_Slug = slug, p_Descripcion = descripcion }))!;

    public async Task<int> EditarAsync(Alcance a, Guid guid, string nombre, string slug, string? descripcion, int? posicion) =>
        await ExecuteScalarAsync<int>(SpNombres.EspacioEditar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid,
                  p_Nombre = nombre, p_Slug = slug, p_Descripcion = descripcion, p_Posicion = posicion });

    public async Task<int> EliminarAsync(Alcance a, Guid guid) =>
        await ExecuteScalarAsync<int>(SpNombres.EspacioEliminar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid });
}
