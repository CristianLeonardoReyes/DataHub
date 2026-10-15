using System.ComponentModel.DataAnnotations;
using DataGlobal.DataHub.Common.Enums;

namespace DataGlobal.DataHub.Common.DTOs;

public class LoginRequest
{
    [Required, MaxLength(254)] public string Correo { get; set; } = "";
    [Required, MaxLength(128)] public string Contrasena { get; set; } = "";
}

public class AceptarInvitacionRequest
{
    [Required, MaxLength(200)] public string Token { get; set; } = "";
    [Required, MaxLength(150)] public string Nombre { get; set; } = "";
    /// <summary>10 a 128 caracteres.</summary>
    [Required] public string Contrasena { get; set; } = "";
}

public class OlvideContrasenaRequest
{
    [Required, MaxLength(254)] public string Correo { get; set; } = "";
}

public class RestablecerContrasenaRequest
{
    [Required, MaxLength(200)] public string Token { get; set; } = "";
    /// <summary>10 a 128 caracteres.</summary>
    [Required] public string Contrasena { get; set; } = "";
}

public record ClienteResumenDto(Guid Guid, string Nombre);

/// <param name="Permisos">Acciones permitidas al perfil, en camelCase (p. ej. clientesGestionar).</param>
public record UsuarioActualDto(Guid Guid, string Nombre, string Correo, PerfilUsuario Perfil, ClienteResumenDto? Cliente, string[] Permisos);
