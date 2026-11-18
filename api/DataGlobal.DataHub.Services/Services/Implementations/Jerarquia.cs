using DataGlobal.DataHub.Common.Enums;
using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Services.Services.Implementations;

/// <summary>Reglas comunes de los servicios de jerarquía (workspaces, espacios, colecciones y páginas).</summary>
internal static class Jerarquia
{
    /// <summary>
    /// Valida el permiso del perfil (si hay acción) y arma el alcance desde el JWT. El alcance por workspace asignado
    /// lo aplica cada SP con VeTodo. Super admin sin cliente seleccionado no puede operar.
    /// </summary>
    public static Alcance Alcance(UsuarioActual actual, Accion? accion = null)
    {
        if (accion is { } a && !Autorizacion.Can(actual, a)) throw new AccesoDenegadoException();
        var clienteId = actual.ClienteId ?? throw new SolicitudInvalidaException("Selecciona un cliente para operar.");
        return new(clienteId, actual.Id, actual.Perfil is "super_admin" or "admin");
    }

    public static string Texto(string? valor, string campo, int max)
    {
        var texto = (valor ?? "").Trim();
        if (texto.Length == 0 || texto.Length > max) throw new SolicitudInvalidaException($"{campo} debe tener entre 1 y {max} caracteres.");
        return texto;
    }

    public static string? Descripcion(string? valor)
    {
        var texto = valor?.Trim();
        if (texto is { Length: > 500 }) throw new SolicitudInvalidaException("La descripción no puede superar 500 caracteres.");
        return string.IsNullOrEmpty(texto) ? null : texto;
    }

    public static void ExigirExiste(int resultado, string mensaje)
    {
        if (resultado == 0) throw new NoEncontradoException(mensaje);
    }
}
