using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Espacios de un workspace (Admin; Coordinador en sus workspaces asignados).</summary>
[ApiController]
[Route("api/v1/espacios")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
public class EspaciosController(IEspacioService espacios) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<CreadoDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Crear(CrearEspacioRequest solicitud) =>
        StatusCode(StatusCodes.Status201Created, new CreadoDto(await espacios.CrearAsync(solicitud)));

    [HttpPut("{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Actualizar(Guid guid, ActualizarElementoRequest solicitud)
    {
        await espacios.ActualizarAsync(guid, solicitud);
        return NoContent();
    }

    /// <summary>Elimina el espacio y todo lo que cuelga de él.</summary>
    [HttpDelete("{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(Guid guid)
    {
        await espacios.EliminarAsync(guid);
        return NoContent();
    }
}
