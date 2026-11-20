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
                ? new PaginaDetalleFilas(p, (await g.ReadAsync<PaginaPadreFila>()).AsList(), (await g.ReadAsync<PaginaPadreFila>()).AsList(),
                    (await g.ReadAsync<string>()).AsList())
                : null);

    public async Task<int> EditarMetadataAsync(Alcance a, Guid guid, string estado, string tipoDocumento, Guid? responsableGuid,
        DateOnly? fechaRevision, string etiquetasJson, bool puedeAprobar) =>
        await ExecuteScalarAsync<int>(SpNombres.PaginaEditarMetadata,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_Guid = guid, p_Estado = estado,
                  p_TipoDocumento = tipoDocumento, p_ResponsableGuid = responsableGuid,
                  p_FechaRevision = fechaRevision?.ToDateTime(TimeOnly.MinValue), p_Etiquetas = etiquetasJson, p_PuedeAprobar = puedeAprobar });

    public Task<IReadOnlyList<string>> ConsultarEtiquetasAsync(Alcance a, string texto) =>
        QueryListAsync<string>(SpNombres.EtiquetaConsultar, new { p_ClienteId = a.ClienteId, p_Texto = texto });

    public Task<IReadOnlyList<ResponsableDto>> ConsultarResponsablesAsync(Alcance a) =>
        QueryListAsync<ResponsableDto>(SpNombres.UsuarioConsultarResponsables, new { p_ClienteId = a.ClienteId });

    public Task<IReadOnlyList<PaginaRecienteDto>> RecientesAsync(Alcance a) =>
        QueryListAsync<PaginaRecienteDto>(SpNombres.PaginaConsultarRecientes,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo });

    public Task<BusquedaFilas> BuscarAsync(Alcance a, string consulta, string primero, int desplazamiento, int limite)
    {
        // La consulta llega como "+uno* +dos*": el SP recibe cada término suelto (NULL si no hay).
        var t = consulta.Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim('+', '*')).ToArray();
        string? T(int i) => i < t.Length ? t[i] : null;
        return QueryMultipleAsync(SpNombres.PaginaConsultarBusqueda,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo,
                  p_T1 = T(0), p_T2 = T(1), p_T3 = T(2), p_T4 = T(3), p_T5 = T(4), p_T6 = T(5), p_T7 = T(6), p_T8 = T(7),
                  p_Primero = primero, p_Desplazamiento = desplazamiento, p_Limite = limite },
            async g => new BusquedaFilas(await g.ReadFirstAsync<int>(), (await g.ReadAsync<BusquedaFila>()).AsList()));
    }

    public async Task<ContenidoFila> ObtenerContenidoAsync(Alcance a, Guid guid) =>
        (await QueryFirstOrNullAsync<ContenidoFila>(SpNombres.ContenidoConsultar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_PaginaGuid = guid }))!;

    public async Task<ResultadoContenido> GuardarContenidoAsync(Alcance a, Guid guid, string contenidoJson, string textoPlano, int version) =>
        (await QueryFirstOrNullAsync<ResultadoContenido>(SpNombres.ContenidoEditar,
            new { p_ClienteId = a.ClienteId, p_UsuarioId = a.UsuarioId, p_VeTodo = a.VeTodo, p_PaginaGuid = guid,
                  p_ContenidoJson = contenidoJson, p_TextoPlano = textoPlano, p_Version = version }))!;
}
