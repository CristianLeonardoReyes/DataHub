namespace DataGlobal.DataHub.Common.Models;

/// <summary>Fila de Usuario (con su cliente) para autenticación. Uso interno, nunca se serializa.</summary>
public class UsuarioAuth
{
    public long Id { get; set; }
    public Guid Guid { get; set; }
    public long? ClienteId { get; set; }
    public Guid? ClienteGuid { get; set; }
    public string? ClienteNombre { get; set; }
    public string Correo { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string? ContrasenaHash { get; set; }
    public string Perfil { get; set; } = "";
    public string Estado { get; set; } = "";
    public bool Bloqueado { get; set; }
}

/// <summary>Usuario de la petición en curso (scoped). Lo llena la validación del JWT.</summary>
public class UsuarioActual
{
    public long Id { get; set; }
    public Guid Guid { get; set; }
    public long? ClienteId { get; set; }
    public Guid? ClienteGuid { get; set; }
    public string? ClienteNombre { get; set; }
    public string Correo { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Perfil { get; set; } = "";
}

/// <summary>Resultado de un login correcto.</summary>
public record Sesion(string Token, DateTime Expira);

/// <summary>Error de validación de entrada o regla de negocio; la API lo traduce a 400.</summary>
public class SolicitudInvalidaException(string mensaje) : Exception(mensaje);
