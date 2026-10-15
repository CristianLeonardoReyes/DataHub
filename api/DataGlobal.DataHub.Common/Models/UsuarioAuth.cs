namespace DataGlobal.DataHub.Common.Models;

/// <summary>Fila de Usuario (con su cliente) para autenticación. Uso interno, nunca se serializa.</summary>
public class UsuarioAuth
{
    public long Id { get; set; }
    public Guid Guid { get; set; }
    public long? ClienteId { get; set; }
    public Guid? ClienteGuid { get; set; }
    public string? ClienteNombre { get; set; }
    /// <summary>Super admin no tiene cliente: se considera activo.</summary>
    public bool ClienteActivo { get; set; } = true;
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

/// <summary>El perfil no tiene permiso para la acción; la API lo traduce a 403.</summary>
public class AccesoDenegadoException(string mensaje = "No tienes permiso para esta operación.") : Exception(mensaje);

/// <summary>Recurso inexistente o fuera de alcance; la API lo traduce a 404.</summary>
public class NoEncontradoException(string mensaje = "No se encontró el recurso.") : Exception(mensaje);

/// <summary>409. <paramref name="campo"/> (nombre del campo en el request) viaja como extensión `campo` del ProblemDetails.</summary>
public class ConflictoException(string mensaje, string? campo = null) : Exception(mensaje)
{
    public string? Campo { get; } = campo;
}

/// <summary>Fila de resultado de cli_insertarConAdmin: 1 ok, 2 slug duplicado, 3 correo duplicado.</summary>
public class ResultadoCrearCliente
{
    public int Resultado { get; set; }
    public Guid? ClienteGuid { get; set; }
}
