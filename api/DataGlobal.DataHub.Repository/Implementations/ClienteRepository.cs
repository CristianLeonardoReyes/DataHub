using DataGlobal.DataHub.Common.Const;
using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Repository.Interfaces;

namespace DataGlobal.DataHub.Repository.Implementations;

public class ClienteRepository(DapperContext context) : BaseRepository(context), IClienteRepository
{
    public Task<IReadOnlyList<ClienteDto>> ListarAsync() =>
        QueryListAsync<ClienteDto>(SpNombres.ClienteListar);

    public Task<ClienteDto?> ObtenerPorGuidAsync(Guid guid) =>
        QueryFirstOrNullAsync<ClienteDto>(SpNombres.ClienteObtenerPorGuid, new { p_Guid = guid });

    public async Task<ResultadoCrearCliente> CrearConAdminAsync(string nombre, string slug, string correoAdmin, string tokenHash, int horas) =>
        (await QueryFirstOrNullAsync<ResultadoCrearCliente>(SpNombres.ClienteCrearConAdmin,
            new { p_Nombre = nombre, p_Slug = slug, p_CorreoAdmin = correoAdmin, p_TokenHash = tokenHash, p_Horas = horas }))!;

    public async Task<int> ActualizarAsync(Guid guid, string nombre, string slug, bool activo) =>
        await ExecuteScalarAsync<int>(SpNombres.ClienteActualizar,
            new { p_Guid = guid, p_Nombre = nombre, p_Slug = slug, p_Activo = activo });
}
