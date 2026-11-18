using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class ColeccionRepository(DapperContext context) : BaseRepository(context), IColeccionRepository
{
    public async Task<ResultadoCrear> InsertarAsync(Alcance a, Guid espacioGuid, string nombre, string slug, string? descripcion) =>
        (await QueryFirstOrNullAsync<ResultadoCrear>(SpNombres.ColeccionInsertar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_EspacioGuid = espacioGuid,
                  p_Nombre = nombre, p_Slug = slug, p_Descripcion = descripcion }))!;

    public async Task<int> EditarAsync(Alcance a, Guid guid, string nombre, string slug, string? descripcion, int? posicion) =>
        await ExecuteScalarAsync<int>(SpNombres.ColeccionEditar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid,
                  p_Nombre = nombre, p_Slug = slug, p_Descripcion = descripcion, p_Posicion = posicion });

    public async Task<int> EliminarAsync(Alcance a, Guid guid) =>
        await ExecuteScalarAsync<int>(SpNombres.ColeccionEliminar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid });
}
