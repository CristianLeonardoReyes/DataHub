using System.ComponentModel.DataAnnotations;

namespace DataGlobal.DataHub.Common.DTOs;

public record ClienteDto(Guid Guid, string Nombre, string Slug, bool Activo, DateTime FechaCreacion);

public class CrearClienteRequest
{
    /// <summary>1 a 150 caracteres.</summary>
    [Required, MaxLength(150)] public string Nombre { get; set; } = "";
    /// <summary>Minúsculas, números y guiones; 3 a 100 caracteres.</summary>
    [Required, StringLength(100, MinimumLength = 3), RegularExpression(@"^[a-z0-9]+(-[a-z0-9]+)*\z")] public string Slug { get; set; } = "";
    /// <summary>Correo del primer Admin, que recibe la invitación.</summary>
    [Required, MaxLength(254)] public string CorreoAdmin { get; set; } = "";
}

public class ActualizarClienteRequest
{
    [Required, MaxLength(150)] public string Nombre { get; set; } = "";
    [Required, StringLength(100, MinimumLength = 3), RegularExpression(@"^[a-z0-9]+(-[a-z0-9]+)*\z")] public string Slug { get; set; } = "";
    public bool Activo { get; set; }
}
