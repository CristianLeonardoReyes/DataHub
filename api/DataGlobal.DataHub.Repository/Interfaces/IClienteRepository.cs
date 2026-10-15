using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Repository.Interfaces;

public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteDto>> ListarAsync();
    Task<ClienteDto?> ObtenerPorGuidAsync(Guid guid);
    Task<ResultadoCrearCliente> CrearConAdminAsync(string nombre, string slug, string correoAdmin, string tokenHash, int horas);
    /// <summary>0 no existe, 1 ok, 2 slug duplicado.</summary>
    Task<int> ActualizarAsync(Guid guid, string nombre, string slug, bool activo);
}
