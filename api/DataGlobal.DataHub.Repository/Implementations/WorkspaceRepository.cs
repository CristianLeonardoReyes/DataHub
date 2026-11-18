using Dapper;
using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class WorkspaceRepository(DapperContext context) : BaseRepository(context), IWorkspaceRepository
{
    public Task<ArbolFilas> ArbolAsync(Alcance a) =>
        QueryMultipleAsync(SpNombres.WorkspaceConsultarArbol,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo },
            async g => new ArbolFilas(
                (await g.ReadAsync<WorkspaceFila>()).AsList(), (await g.ReadAsync<EspacioFila>()).AsList(),
                (await g.ReadAsync<ColeccionFila>()).AsList(), (await g.ReadAsync<PaginaFila>()).AsList()));

    public async Task<ResultadoCrear> InsertarAsync(Alcance a, string nombre, string slug, string? descripcion) =>
        (await QueryFirstOrNullAsync<ResultadoCrear>(SpNombres.WorkspaceInsertar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_Nombre = nombre, p_Slug = slug, p_Descripcion = descripcion }))!;

    public async Task<int> EditarAsync(Alcance a, Guid guid, string nombre, string slug, string? descripcion, int? posicion) =>
        await ExecuteScalarAsync<int>(SpNombres.WorkspaceEditar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid,
                  p_Nombre = nombre, p_Slug = slug, p_Descripcion = descripcion, p_Posicion = posicion });

    public async Task<int> EliminarAsync(Alcance a, Guid guid) =>
        await ExecuteScalarAsync<int>(SpNombres.WorkspaceEliminar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid });

    public Task<MiembrosFilas> MiembrosAsync(long clienteId, Guid workspaceGuid) =>
        QueryMultipleAsync(SpNombres.MiembroConsultar, new { p_ClienteId = clienteId, p_WorkspaceGuid = workspaceGuid },
            async g => new MiembrosFilas(await g.ReadFirstAsync<bool>(), (await g.ReadAsync<MiembroFila>()).AsList()));

    public async Task<int> AsignarMiembrosAsync(long clienteId, Guid workspaceGuid, string usuariosJson) =>
        await ExecuteScalarAsync<int>(SpNombres.MiembroEditar,
            new { p_ClienteId = clienteId, p_WorkspaceGuid = workspaceGuid, p_Usuarios = usuariosJson });
}
