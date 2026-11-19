using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Apoyo a la metadata de páginas: etiquetas del cliente y posibles responsables.</summary>
[ApiController]
[Route("api/v1")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
public class EtiquetasController(IPaginaService paginas) : ControllerBase
{
    /// <summary>Hasta 10 etiquetas del cliente que empiezan por q (normalizado), en orden alfabético.</summary>
    [HttpGet("etiquetas")]
    [ProducesResponseType<IReadOnlyList<string>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<string>> Etiquetas([FromQuery] string? q) => await paginas.EtiquetasAsync(q);

    /// <summary>Usuarios del cliente no inactivos, por nombre.</summary>
    [HttpGet("responsables")]
    [ProducesResponseType<IReadOnlyList<ResponsableDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<ResponsableDto>> Responsables() => await paginas.ResponsablesAsync();
}
