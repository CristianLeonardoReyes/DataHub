using System.Security.Claims;
using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DataGlobal.DataHub.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IAuthService auth, UsuarioActual actual) : ControllerBase
{
    public const string Cookie = "datahub_sesion";

    /// <summary>Inicia sesión; deja el JWT en la cookie HttpOnly datahub_sesion.</summary>
    [HttpPost("login"), AllowAnonymous, EnableRateLimiting("login")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login(LoginRequest solicitud)
    {
        var sesion = await auth.LoginAsync(solicitud);
        if (sesion is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Correo o contraseña incorrectos.");

        Response.Cookies.Append(Cookie, sesion.Token, OpcionesCookie(new DateTimeOffset(DateTime.SpecifyKind(sesion.Expira, DateTimeKind.Utc))));
        return NoContent();
    }

    /// <summary>Cierra la sesión (borra la cookie). Se permite sin sesión.</summary>
    [HttpPost("logout"), AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(Cookie, OpcionesCookie(null));
        return NoContent();
    }

    /// <summary>Usuario de la sesión actual.</summary>
    [HttpGet("me")]
    [ProducesResponseType<UsuarioActualDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<UsuarioActualDto> Me() =>
        new UsuarioActualDto(actual.Guid, actual.Nombre, actual.Correo, MatrizPermisos.ParsearPerfil(actual.Perfil),
            actual.ClienteGuid is { } g ? new ClienteResumenDto(g, actual.ClienteNombre ?? "") : null,
            [.. MatrizPermisos.De(MatrizPermisos.ParsearPerfil(actual.Perfil)).Select(MatrizPermisos.Nombre)]);

    /// <summary>Solo Super admin: elige el cliente activo en el que opera (null = ninguno). No alarga la sesión.</summary>
    [HttpPost("cliente-operando")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ClienteOperando(ClienteOperandoRequest solicitud)
    {
        if (!long.TryParse(User.FindFirstValue("exp"), out var exp)) return Unauthorized();
        var expira = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;
        var sesion = await auth.CambiarClienteOperandoAsync(solicitud.ClienteGuid, expira);
        Response.Cookies.Append(Cookie, sesion.Token, OpcionesCookie(new DateTimeOffset(DateTime.SpecifyKind(sesion.Expira, DateTimeKind.Utc))));
        return NoContent();
    }

    /// <summary>Activa la cuenta invitada: fija nombre y contraseña.</summary>
    [HttpPost("aceptar-invitacion"), AllowAnonymous, EnableRateLimiting("token")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> AceptarInvitacion(AceptarInvitacionRequest solicitud)
    {
        await auth.AceptarInvitacionAsync(solicitud);
        return NoContent();
    }

    /// <summary>Envía el enlace de restablecimiento si el usuario existe y está activo; responde 202 siempre.</summary>
    [HttpPost("olvide-contrasena"), AllowAnonymous, EnableRateLimiting("olvide")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> OlvideContrasena(OlvideContrasenaRequest solicitud)
    {
        await auth.OlvideContrasenaAsync(solicitud.Correo);
        return Accepted();
    }

    /// <summary>Fija una contraseña nueva con el token recibido por correo.</summary>
    [HttpPost("restablecer-contrasena"), AllowAnonymous, EnableRateLimiting("token")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> RestablecerContrasena(RestablecerContrasenaRequest solicitud)
    {
        await auth.RestablecerContrasenaAsync(solicitud);
        return NoContent();
    }

    private static CookieOptions OpcionesCookie(DateTimeOffset? expira) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Path = "/",
        Expires = expira
    };
}
