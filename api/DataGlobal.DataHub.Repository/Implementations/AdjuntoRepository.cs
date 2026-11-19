using Dapper;
using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class AdjuntoRepository(DapperContext context) : BaseRepository(context), IAdjuntoRepository
{
    public async Task<int> InsertarAsync(Alcance a, Guid paginaGuid, Guid guid, string nombre, string rutaBlob, string tipoMime, long tamanoBytes) =>
        await ExecuteScalarAsync<int>(SpNombres.AdjuntoInsertar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_PaginaGuid = paginaGuid, p_Guid = guid,
                  p_NombreOriginal = nombre, p_RutaBlob = rutaBlob, p_TipoMime = tipoMime, p_TamanoBytes = tamanoBytes });

    public Task<AdjuntosPaginaFilas> ConsultarPorPaginaAsync(Alcance a, Guid paginaGuid) =>
        QueryMultipleAsync(SpNombres.AdjuntoConsultarPorPagina,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_PaginaGuid = paginaGuid },
            async g => new AdjuntosPaginaFilas(await g.ReadFirstAsync<int>(), (await g.ReadAsync<AdjuntoFila>()).AsList()));

    public Task<AdjuntoRutaFila?> ConsultarPorGuidAsync(Alcance a, Guid guid) =>
        QueryFirstOrNullAsync<AdjuntoRutaFila>(SpNombres.AdjuntoConsultarPorGuid,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid });

    public async Task<int> EliminarAsync(Alcance a, Guid guid, bool soloPropio) =>
        await ExecuteScalarAsync<int>(SpNombres.AdjuntoEliminar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid, p_SoloPropio = soloPropio });
}
