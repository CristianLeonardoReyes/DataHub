using DataGlobal.DataHub.Common.Models;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Middleware;

/// <summary>Traduce SolicitudInvalidaException a 400 con ProblemDetails; el resto cae al manejador por defecto (500 sin detalles).</summary>
public class SolicitudInvalidaHandler(IProblemDetailsService problemas) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is not SolicitudInvalidaException) return false;
        ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await problemas.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx,
            ProblemDetails = new ProblemDetails { Status = 400, Title = "Solicitud inválida", Detail = ex.Message }
        });
    }
}
