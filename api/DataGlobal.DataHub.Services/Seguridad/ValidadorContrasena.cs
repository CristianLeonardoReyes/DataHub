namespace DataGlobal.DataHub.Services.Seguridad;

public static class ValidadorContrasena
{
    public const int Minimo = 10;
    public const int Maximo = 128;
    public const string Requisitos = "La contraseña debe tener mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo (por ejemplo @).";

    /// <summary>Devuelve el mensaje de error, o null si la contraseña es válida (RF-ACC-07).</summary>
    public static string? Validar(string? c) =>
        c is null || c.Length < Minimo || !c.Any(char.IsUpper) || !c.Any(char.IsLower) || !c.Any(char.IsDigit)
            || !c.Any(x => !char.IsLetterOrDigit(x) && !char.IsWhiteSpace(x))
            ? Requisitos
        : c.Length > Maximo ? $"La contraseña no puede superar {Maximo} caracteres."
        : null;
}
