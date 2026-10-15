using DataGlobal.DataHub.Common.DTOs;
using DataGlobal.DataHub.Services.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DataGlobal.DataHub.Api.Controllers;

/// <summary>Gestión de clientes: solo Super admin.</summary>
[ApiController]
[Route("api/v1/clientes")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
public class ClientesController(IClienteService clientes) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<ClienteDto>> Listar() => await clientes.ListarAsync();

    [HttpGet("{guid:guid}")]
    [ProducesResponseType<ClienteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ClienteDto> Obtener(Guid guid) => await clientes.ObtenerAsync(guid);

    /// <summary>Crea el cliente y su primer Admin (invitado por correo, enlace de 72 h).</summary>
    [HttpPost]
    [ProducesResponseType<ClienteDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear(CrearClienteRequest solicitud)
    {
        var c = await clientes.CrearAsync(solicitud);
        return CreatedAtAction(nameof(Obtener), new { guid = c.Guid }, c);
    }

    /// <summary>Actualiza nombre, slug y estado. Un cliente inactivo deja sin acceso a sus usuarios.</summary>
    [HttpPut("{guid:guid}")]
    [ProducesResponseType<ClienteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ClienteDto> Actualizar(Guid guid, ActualizarClienteRequest solicitud) =>
        await clientes.ActualizarAsync(guid, solicitud);
}
