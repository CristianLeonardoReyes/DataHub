using System.Text.RegularExpressions;

namespace DataGlobal.DataHub.Common.Util;

public static partial class Etiquetas
{
    /// <summary>Trim, espacios internos colapsados a uno y minúsculas.</summary>
    public static string Normalizar(string? nombre) => Espacios().Replace((nombre ?? "").Trim(), " ").ToLowerInvariant();

    /// <summary>Normaliza cada nombre; descarta vacíos y duplicados conservando el orden.</summary>
    public static List<string> Normalizar(IEnumerable<string?>? nombres) =>
        [.. (nombres ?? []).Select(Normalizar).Where(n => n.Length > 0).Distinct()];

    [GeneratedRegex(@"\s+")]
    private static partial Regex Espacios();
}
