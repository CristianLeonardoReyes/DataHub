using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace DataGlobal.DataHub.Common.Util;

public static partial class Slug
{
    /// <summary>Minúsculas, sin tildes, guiones entre palabras; máximo 200 caracteres. Sin letras ni dígitos latinos: "sin-nombre".</summary>
    public static string De(string texto)
    {
        var sb = new StringBuilder();
        foreach (var c in texto.Normalize(NormalizationForm.FormD))
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) sb.Append(char.ToLowerInvariant(c));
        var slug = NoAlfanumerico().Replace(sb.ToString(), "-").Trim('-');
        if (slug.Length > 200) slug = slug[..200].TrimEnd('-');
        return slug.Length == 0 ? "sin-nombre" : slug;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NoAlfanumerico();
}
