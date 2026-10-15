using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Usuarios del cliente de la sesión (Admin; Super admin con cliente seleccionado).</summary>
[ApiController]
[Route("api/v1/usuarios")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
public class UsuariosController(IUsuarioService usuarios) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<UsuarioDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<UsuarioDto>> Listar() => await usuarios.ListarAsync();

    /// <summary>Crea el usuario invitado y le envía el enlace de invitación (72 h).</summary>
    [HttpPost]
    [ProducesResponseType<UsuarioDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Invitar(InvitarUsuarioRequest solicitud)
    {
        var u = await usuarios.InvitarAsync(solicitud);
        return Created($"/api/v1/usuarios/{u.Guid}", u);
    }

    /// <summary>Invalida las invitaciones pendientes y envía una nueva (72 h). Solo usuarios invitados.</summary>
    [HttpPost("{guid:guid}/reenviar-invitacion")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReenviarInvitacion(Guid guid)
    {
        await usuarios.ReenviarInvitacionAsync(guid);
        return NoContent();
    }

    /// <summary>Cambia perfil y estado (activo/inactivo). Siempre queda al menos un Admin activo.</summary>
    [HttpPut("{guid:guid}")]
    [ProducesResponseType<UsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<UsuarioDto> Actualizar(Guid guid, ActualizarUsuarioRequest solicitud) =>
        await usuarios.ActualizarAsync(guid, solicitud);
}
