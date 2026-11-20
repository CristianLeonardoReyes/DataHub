using DataGlobal.DataHub.Common.Models;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace DataGlobal.DataHub.Api.Middleware;

/// <summary>Traduce las excepciones de negocio (400, 403, 404, 409) a ProblemDetails; el resto cae al manejador por defecto (500 sin detalles).</summary>
public class SolicitudInvalidaHandler(IProblemDetailsService problemas) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry } mysql) ex = Duplicado(mysql, ctx.Request.Path);
        if (ex is MySqlException { SqlState: "45000" })
        {
            ctx.Response.StatusCode = 503;
            return await problemas.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = ctx,
                ProblemDetails = new ProblemDetails { Status = 503, Title = "Servicio ocupado", Detail = "Hay otra alta en curso. Intenta de nuevo en unos segundos." }
            });
        }
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

    /// <summary>Clave duplicada por una carrera entre altas: 409 según el índice, sin el texto de MySQL (puede llevar el valor).</summary>
    private static ConflictoException Duplicado(MySqlException ex, PathString ruta)
    {
        var indice = ex.Message;
        if (indice.Contains("UQ_Cliente_Nombre")) return new("Ya existe un cliente con ese nombre.", "nombre");
        if (indice.Contains("UQ_Cliente_Slug")) return new("Ya existe un cliente con ese slug.", "slug");
        if (indice.Contains("UQ_Usuario_Correo"))
            return new("Ya existe un usuario con ese correo.", ruta.StartsWithSegments("/api/v1/clientes") ? "correoAdmin" : "correo");
        return new("Ya existe un registro con esos datos.");
    }
}
