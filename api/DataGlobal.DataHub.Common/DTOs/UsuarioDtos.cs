using System.ComponentModel.DataAnnotations;
using DataGlobal.DataHub.Common.Enums;

namespace DataGlobal.DataHub.Common.DTOs;

public record UsuarioDto(Guid Guid, string Nombre, string Correo, PerfilUsuario Perfil, EstadoUsuario Estado, DateTime FechaCreacion);

public class InvitarUsuarioRequest
{
    [Required, MaxLength(254)] public string Correo { get; set; } = "";
    /// <summary>admin, coordinador o colaborador (super_admin no es asignable).</summary>
    public PerfilUsuario Perfil { get; set; }
}

public class ActualizarUsuarioRequest
{
    /// <summary>admin, coordinador o colaborador (super_admin no es asignable).</summary>
    public PerfilUsuario Perfil { get; set; }
    /// <summary>true = activo, false = inactivo. En un usuario invitado solo se admite true (no cambia nada).</summary>
    public bool Activo { get; set; }
}
