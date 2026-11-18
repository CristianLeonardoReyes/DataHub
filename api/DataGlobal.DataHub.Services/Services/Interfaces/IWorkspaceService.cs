using DataGlobal.DataHub.Common.DTOs;

namespace DataGlobal.DataHub.Services.Services.Interfaces;

public interface IWorkspaceService
{
    Task<IReadOnlyList<WorkspaceArbolDto>> ArbolAsync();
    Task<Guid> CrearAsync(CrearWorkspaceRequest solicitud);
    Task ActualizarAsync(Guid guid, ActualizarElementoRequest solicitud);
    Task EliminarAsync(Guid guid);
    Task<IReadOnlyList<MiembroDto>> MiembrosAsync(Guid guid);
    Task AsignarMiembrosAsync(Guid guid, AsignarMiembrosRequest solicitud);
}
