using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Árbol de navegación, workspaces y sus miembros del cliente de la sesión.</summary>
[ApiController]
[Route("api/v1")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
public class WorkspacesController(IWorkspaceService workspaces) : ControllerBase
{
    /// <summary>Workspaces visibles para el usuario con sus espacios, colecciones y páginas anidadas.</summary>
    [HttpGet("arbol")]
    [ProducesResponseType<IReadOnlyList<WorkspaceArbolDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<WorkspaceArbolDto>> Arbol() => await workspaces.ArbolAsync();

    [HttpPost("workspaces")]
    [ProducesResponseType<CreadoDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Crear(CrearWorkspaceRequest solicitud) =>
        StatusCode(StatusCodes.Status201Created, new CreadoDto(await workspaces.CrearAsync(solicitud)));

    [HttpPut("workspaces/{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Actualizar(Guid guid, ActualizarElementoRequest solicitud)
    {
        await workspaces.ActualizarAsync(guid, solicitud);
        return NoContent();
    }

    /// <summary>Elimina el workspace y todo lo que cuelga de él.</summary>
    [HttpDelete("workspaces/{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(Guid guid)
    {
        await workspaces.EliminarAsync(guid);
        return NoContent();
    }

    /// <summary>Coordinadores y colaboradores del cliente, marcando los asignados al workspace.</summary>
    [HttpGet("workspaces/{guid:guid}/miembros")]
    [ProducesResponseType<IReadOnlyList<MiembroDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<MiembroDto>> Miembros(Guid guid) => await workspaces.MiembrosAsync(guid);

    /// <summary>Reemplaza los miembros del workspace. 400 si algún usuario no es coordinador o colaborador del cliente.</summary>
    [HttpPut("workspaces/{guid:guid}/miembros")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AsignarMiembros(Guid guid, AsignarMiembrosRequest solicitud)
    {
        await workspaces.AsignarMiembrosAsync(guid, solicitud);
        return NoContent();
    }
}
