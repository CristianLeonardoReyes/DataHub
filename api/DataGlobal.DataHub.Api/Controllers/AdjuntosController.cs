using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Settings;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Archivos adjuntos de las páginas, en Blob privado; se leen con enlaces temporales.</summary>
[ApiController]
[Route("api/v1")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
public class AdjuntosController(IAdjuntoService adjuntos) : ControllerBase
{
    [HttpGet("paginas/{guid:guid}/adjuntos")]
    [ProducesResponseType<IReadOnlyList<AdjuntoDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<AdjuntoDto>> Listar(Guid guid) => await adjuntos.ListarAsync(guid);

    /// <summary>Sube un archivo (multipart, campo "archivo"). 400 si está vacío o supera el máximo configurado (25 MB por defecto).</summary>
    [HttpPost("paginas/{guid:guid}/adjuntos")]
    [EnableRateLimiting("subida")]
    [LimiteSubida]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<AdjuntoDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Subir(Guid guid, IFormFile archivo)
    {
        await using var stream = archivo.OpenReadStream();
        var dto = await adjuntos.SubirAsync(guid, archivo.FileName, archivo.ContentType, archivo.Length, stream);
        return Created($"/api/v1/paginas/{guid}/adjuntos", dto);
    }

    /// <summary>Enlace de solo lectura válido 10 minutos. descargar=true fuerza la descarga; los tipos no previsualizables siempre se descargan.</summary>
    [HttpGet("adjuntos/{guid:guid}/url")]
    [ProducesResponseType<UrlAdjuntoDto>(StatusCodes.Status200OK)]
    public async Task<UrlAdjuntoDto> ObtenerUrl(Guid guid, [FromQuery] bool descargar = false) => await adjuntos.UrlAsync(guid, descargar);

    /// <summary>Eliminación lógica; el archivo en Blob se conserva. El Colaborador solo elimina los propios (403 si no).</summary>
    [HttpDelete("adjuntos/{guid:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(Guid guid)
    {
        await adjuntos.EliminarAsync(guid);
        return NoContent();
    }
}

/// <summary>
/// Corta el cuerpo de la subida en Archivos:TamanoMaximoMb + 1 MB (margen del multipart) antes de leerlo,
/// para no recibir archivos enteros que luego se rechazan. El 400 con mensaje claro lo da el servicio.
/// </summary>
public sealed class LimiteSubidaAttribute : Attribute, IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var mb = context.HttpContext.RequestServices.GetRequiredService<IOptions<ArchivosOpciones>>().Value.TamanoMaximoMb;
        var tope = (mb + 1L) * 1024 * 1024;
        var cuerpo = context.HttpContext.Features.Get<IHttpMaxRequestBodySizeFeature>();
        if (cuerpo is { IsReadOnly: false }) cuerpo.MaxRequestBodySize = tope;
        context.HttpContext.Features.Set<IFormFeature>(
            new FormFeature(context.HttpContext.Request, new FormOptions { MultipartBodyLengthLimit = tope }));
    }

    public void OnResourceExecuted(ResourceExecutedContext context) { }
}
