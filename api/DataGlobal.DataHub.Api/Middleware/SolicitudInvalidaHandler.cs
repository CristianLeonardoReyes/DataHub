using DataGlobal.DataHub.Common.Models;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Middleware;

/// <summary>Traduce las excepciones de negocio (400, 403, 404, 409) a ProblemDetails; el resto cae al manejador por defecto (500 sin detalles).</summary>
public class SolicitudInvalidaHandler(IProblemDetailsService problemas) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, titulo) = ex switch
        {
            SolicitudInvalidaException => (400, "Solicitud inválida"),
            AccesoDenegadoException => (403, "Acceso denegado"),
            NoEncontradoException => (404, "No encontrado"),
            ConflictoException => (409, "Conflicto"),
            _ => (0, "")
        };
        if (status == 0) return false;
        ctx.Response.StatusCode = status;
        var problema = new ProblemDetails { Status = status, Title = titulo, Detail = ex.Message };
        if (ex is ConflictoException { Campo: { } campo }) problema.Extensions["campo"] = campo;
        return await problemas.TryWriteAsync(new ProblemDetailsContext { HttpContext = ctx, ProblemDetails = problema });
    }
}
