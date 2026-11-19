using System.Text;

namespace DataGlobal.DataHub.Common.Util;

/// <summary>Prepara el texto del usuario para MATCH ... AGAINST en BOOLEAN MODE sin dejar pasar operadores.</summary>
public static class ConsultaBusqueda
{
    public const int MaxCaracteres = 100;
    public const int MaxTerminos = 8;
    public const int MinTermino = 2;

    /// <summary>Lista por defecto de InnoDB (INNODB_FT_DEFAULT_STOPWORD): como término obligatorio nunca coincidiría.</summary>
    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
    {
        "a", "about", "an", "are", "as", "at", "be", "by", "com", "de", "en", "for", "from", "how", "i", "in", "is", "it", "la",
        "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "where", "who", "will", "with", "und", "www"
    };

    /// <summary>Consulta lista ("+uno* +dos*") y primer término limpio; null si no queda ningún término válido.</summary>
    public static (string Consulta, string Primero)? Preparar(string? texto)
    {
        var t = (texto ?? "").Trim();
        if (t.Length > MaxCaracteres) t = t[..MaxCaracteres];
        var sb = new StringBuilder();
        foreach (var c in t) sb.Append(char.IsLetterOrDigit(c) ? c : ' ');
        var terminos = sb.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(x => x.Length >= MinTermino && !Stopwords.Contains(x)).Take(MaxTerminos).ToList();
        return terminos.Count == 0 ? null : (string.Join(' ', terminos.Select(x => $"+{x}*")), terminos[0]);
    }
}
