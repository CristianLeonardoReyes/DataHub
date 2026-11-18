using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Páginas y subpáginas (sin contenido) dentro del alcance del usuario.</summary>
[ApiController]
[Route("api/v1/paginas")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
public class PaginasController(IPaginaService paginas) : ControllerBase
{
    /// <summary>Las 10 páginas visibles actualizadas más recientemente.</summary>
    [HttpGet("recientes")]
    [ProducesResponseType<IReadOnlyList<PaginaRecienteDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<PaginaRecienteDto>> Recientes() => await paginas.RecientesAsync();

    /// <summary>La página con su ruta (workspace, espacio, colección y páginas padre) y sus subpáginas directas.</summary>
    [HttpGet("{guid:guid}")]
    [ProducesResponseType<PaginaDetalleDto>(StatusCodes.Status200OK)]
    public async Task<PaginaDetalleDto> Obtener(Guid guid) => await paginas.ObtenerAsync(guid);

    [HttpPost]
    [ProducesResponseType<CreadoDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Crear(CrearPaginaRequest solicitud)
    {
        var guid = await paginas.CrearAsync(solicitud);
        return Created($"/api/v1/paginas/{guid}", new CreadoDto(guid));
    }

    /// <summary>Cambia título, página padre (misma colección) y posición. 400 si el padre es la propia página o una descendiente.</summary>
    [HttpPut("{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Actualizar(Guid guid, ActualizarPaginaRequest solicitud)
    {
        await paginas.ActualizarAsync(guid, solicitud);
        return NoContent();
    }

    /// <summary>Elimina la página y sus subpáginas. El Colaborador solo elimina las propias y sin subpáginas (403 si no).</summary>
    [HttpDelete("{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(Guid guid)
    {
        await paginas.EliminarAsync(guid);
        return NoContent();
    }
}
