namespace DataGlobal.DataHub.Services.Seguridad;

public static class ValidadorContrasena
{
    public const int Minimo = 10;
    public const int Maximo = 128;

    /// <summary>Devuelve el mensaje de error, o null si la contraseña es válida.</summary>
    public static string? Validar(string? contrasena) =>
        contrasena is null || contrasena.Length < Minimo ? $"La contraseña debe tener al menos {Minimo} caracteres."
        : contrasena.Length > Maximo ? $"La contraseña no puede superar {Maximo} caracteres."
        : null;
}
