using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IEspacioService
{
    Task<Guid> CrearAsync(CrearEspacioRequest solicitud);
    Task ActualizarAsync(Guid guid, ActualizarElementoRequest solicitud);
    Task EliminarAsync(Guid guid);
}
