using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Búsqueda de páginas por título y contenido dentro del alcance del usuario.</summary>
[ApiController]
[Route("api/v1/buscar")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
public class BusquedaController(IPaginaService paginas) : ControllerBase
{
    /// <summary>Todos los términos son obligatorios y coinciden por prefijo. 20 por página; pagina de 1 a 500. 400 si q no tiene al menos un término de 2 letras.</summary>
    [HttpGet]
    [EnableRateLimiting("busqueda")]
    [ProducesResponseType<BusquedaDto>(StatusCodes.Status200OK)]
    public async Task<BusquedaDto> Buscar([FromQuery] string? q, [FromQuery] int pagina = 1) => await paginas.BuscarAsync(q, pagina);
}
