using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IColeccionService
{
    Task<Guid> CrearAsync(CrearColeccionRequest solicitud);
    Task ActualizarAsync(Guid guid, ActualizarElementoRequest solicitud);
    Task EliminarAsync(Guid guid);
}
