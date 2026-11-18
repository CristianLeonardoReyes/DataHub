using Dapper;
using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class PaginaRepository(DapperContext context) : BaseRepository(context), IPaginaRepository
{
    public async Task<ResultadoCrear> InsertarAsync(Alcance a, Guid coleccionGuid, Guid? paginaPadreGuid, string titulo, string slug) =>
        (await QueryFirstOrNullAsync<ResultadoCrear>(SpNombres.PaginaInsertar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_ColeccionGuid = coleccionGuid,
                  p_PaginaPadreGuid = paginaPadreGuid, p_Titulo = titulo, p_Slug = slug }))!;

    public async Task<int> EditarAsync(Alcance a, Guid guid, string titulo, string slug, Guid? paginaPadreGuid, int? posicion) =>
        await ExecuteScalarAsync<int>(SpNombres.PaginaEditar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid,
                  p_Titulo = titulo, p_Slug = slug, p_PaginaPadreGuid = paginaPadreGuid, p_Posicion = posicion });

    public async Task<int> EliminarAsync(Alcance a, Guid guid, bool soloPropiaSinHijas) =>
        await ExecuteScalarAsync<int>(SpNombres.PaginaEliminar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid,
                  p_SoloPropiaSinHijas = soloPropiaSinHijas });

    public Task<PaginaDetalleFilas?> ObtenerAsync(Alcance a, Guid guid) =>
        QueryMultipleAsync(SpNombres.PaginaConsultarPorGuid,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid },
            async g => await g.ReadFirstOrDefaultAsync<PaginaDetalleFila>() is { } p
                ? new PaginaDetalleFilas(p, (await g.ReadAsync<PaginaPadreFila>()).AsList(), (await g.ReadAsync<PaginaPadreFila>()).AsList())
                : null);

    public Task<IReadOnlyList<PaginaRecienteDto>> RecientesAsync(Alcance a) =>
        QueryListAsync<PaginaRecienteDto>(SpNombres.PaginaConsultarRecientes,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo });
}
