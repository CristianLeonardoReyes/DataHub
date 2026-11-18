using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Colecciones de un espacio (Admin; Coordinador en sus workspaces asignados).</summary>
[ApiController]
[Route("api/v1/colecciones")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
public class ColeccionesController(IColeccionService colecciones) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<CreadoDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Crear(CrearColeccionRequest solicitud) =>
        StatusCode(StatusCodes.Status201Created, new CreadoDto(await colecciones.CrearAsync(solicitud)));

    [HttpPut("{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Actualizar(Guid guid, ActualizarElementoRequest solicitud)
    {
        await colecciones.ActualizarAsync(guid, solicitud);
        return NoContent();
    }

    /// <summary>Elimina la colección y sus páginas.</summary>
    [HttpDelete("{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(Guid guid)
    {
        await colecciones.EliminarAsync(guid);
        return NoContent();
    }
}
