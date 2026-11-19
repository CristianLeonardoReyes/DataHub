using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace DataGlobal.DataHub.Common.Util;

/// <summary>Datos del Front Matter (RF-MD-03). Owner null: la línea se omite. ReviewDate null: la línea se omite.</summary>
public record FrontMatterPagina(string Title, string Status, string Type, string Workspace, string Space, string Collection,
    string? Owner, IReadOnlyList<string> Tags, DateOnly? ReviewDate, DateTime UpdatedAt);

/// <summary>Serializa el JSON de Tiptap a Markdown (RF-MD-02). Determinístico: sin cultura, sin hora actual, saltos "\n".</summary>
public static partial class MarkdownTiptap
{
    private static readonly string[] Esquemas = ["http://", "https://", "mailto:"];

    /// <summary>Front Matter y cuerpo; un solo salto de línea final.</summary>
    public static string Documento(FrontMatterPagina datos, JsonElement? doc)
    {
        var cuerpo = Serializar(doc);
        return FrontMatter(datos) + (cuerpo.Length == 0 ? "" : "\n" + cuerpo);
    }

    public static string FrontMatter(FrontMatterPagina d)
    {
        var sb = new StringBuilder("---\n");
        sb.Append("title: ").Append(Citar(d.Title)).Append('\n');
        sb.Append("status: ").Append(d.Status).Append('\n');
        sb.Append("type: ").Append(d.Type).Append('\n');
        sb.Append("workspace: ").Append(Citar(d.Workspace)).Append('\n');
        sb.Append("space: ").Append(Citar(d.Space)).Append('\n');
        sb.Append("collection: ").Append(Citar(d.Collection)).Append('\n');
        if (!string.IsNullOrEmpty(d.Owner)) sb.Append("owner: ").Append(Citar(d.Owner)).Append('\n');
        var tags = d.Tags.Order(StringComparer.Ordinal).Select(Citar);
        sb.Append("tags: [").Append(string.Join(", ", tags)).Append("]\n");
        if (d.ReviewDate is { } r) sb.Append("review_date: ").Append(r.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)).Append('\n');
        sb.Append("updated_at: ").Append(d.UpdatedAt.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture)).Append('\n');
        return sb.Append("---\n").ToString();
    }

    /// <summary>Cuerpo en Markdown; vacío si el documento es null o no tiene contenido.</summary>
    public static string Serializar(JsonElement? doc)
    {
        if (doc is not { ValueKind: JsonValueKind.Object } d) return "";
        var cuerpo = Bloques(Hijos(d));
        return cuerpo.Length == 0 ? "" : cuerpo + "\n";
    }

    // ---------- YAML

    private static string Citar(string s)
    {
        var sb = new StringBuilder("\"");
        foreach (var c in s)
            switch (c)
            {
                case '\\': sb.Append("\\\\"); break;
                case '"': sb.Append("\\\""); break;
                case '\n': sb.Append("\\n"); break;
                case '\r': sb.Append("\\r"); break;
                case '\t': sb.Append("\\t"); break;
                case < ' ' or (>= '\x7f' and <= '\x85') or (>= '\x2028' and <= '\x2029'): sb.Append("\\u").Append(((int)c).ToString("X4", CultureInfo.InvariantCulture)); break;
                default: sb.Append(c); break;
            }
        return sb.Append('"').ToString();
    }

    // ---------- bloques

    private static IEnumerable<JsonElement> Hijos(JsonElement n) =>
        n.ValueKind == JsonValueKind.Object && n.TryGetProperty("content", out var c) && c.ValueKind == JsonValueKind.Array
            ? c.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.Object) : [];

    private static string Tipo(JsonElement n) => Cadena(n, "type") ?? "";

    private static string? Cadena(JsonElement n, string prop) =>
        n.ValueKind == JsonValueKind.Object && n.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static JsonElement Attrs(JsonElement n) =>
        n.ValueKind == JsonValueKind.Object && n.TryGetProperty("attrs", out var a) && a.ValueKind == JsonValueKind.Object ? a : default;

    private static int Entero(JsonElement n, string prop, int defecto) =>
        Attrs(n) is { ValueKind: JsonValueKind.Object } a && a.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i) ? i : defecto;

    private static bool EsLista(string tipo) => tipo is "bulletList" or "orderedList" or "taskList";

    // Dos listas del mismo tipo seguidas se funden en CommonMark: un comentario HTML vacío las separa.
    private const string SeparadorListas = "\n\n<!-- -->\n\n";

    private static string Bloques(IEnumerable<JsonElement> nodos)
    {
        var sb = new StringBuilder();
        var previo = "";
        foreach (var n in nodos)
        {
            var s = Bloque(n);
            if (s.Length == 0) continue;
            var tipo = Tipo(n);
            if (sb.Length > 0) sb.Append(EsLista(tipo) && tipo == previo ? SeparadorListas : "\n\n");
            sb.Append(s);
            previo = tipo;
        }
        return sb.ToString();
    }

    private static string Bloque(JsonElement n)
    {
        var tipo = Tipo(n);
        switch (tipo)
        {
            case "paragraph": return InicioDeLinea(SinSaltoFinal(Inline(n)));
            case "heading":
                var texto = Inline(n).Replace("\\\n", " ").Replace("\n", " ").Trim();
                return texto.Length == 0 ? "" : new string('#', Math.Clamp(Entero(n, "level", 1), 1, 6)) + " " + texto;
            case "blockquote":
                return string.Join("\n", Bloques(Hijos(n)).Split('\n').Select(l => l.Length == 0 ? ">" : "> " + l));
            case "codeBlock": return Codigo(n);
            case "horizontalRule": return "---";
            case "bulletList": case "orderedList": case "taskList": return Lista(n, tipo == "orderedList");
            case "table": return Tabla(n);
            case "image": return Imagen(n);
            case "hardBreak": return "";
            case "text": return Texto(n);
        }
        var hijos = Hijos(n).ToList();
        if (hijos.Count == 0) return "";
        return hijos.All(h => Tipo(h) is "text" or "hardBreak" or "image") ? Inline(n) : Bloques(hijos);
    }

    private static string Codigo(JsonElement n)
    {
        var codigo = string.Concat(Hijos(n).Select(h => Cadena(h, "text") ?? "")).Replace("\r\n", "\n").Replace('\r', '\n').TrimEnd('\n');
        var lenguaje = new string([.. (Cadena(Attrs(n), "language") ?? "").Where(c => char.IsAsciiLetterOrDigit(c) || c is '+' or '-' or '#' or '.' or '_')]);
        var cerca = new string('`', Math.Max(3, MaxCorrida(codigo, '`') + 1));
        return $"{cerca}{lenguaje}\n{codigo}\n{cerca}";
    }

    private static int MaxCorrida(string s, char c)
    {
        int max = 0, actual = 0;
        foreach (var x in s) { actual = x == c ? actual + 1 : 0; max = Math.Max(max, actual); }
        return max;
    }

    private static string Lista(JsonElement lista, bool ordenada)
    {
        var inicio = ordenada ? Math.Clamp(Entero(lista, "start", 1), 0, 999999999) : 1;
        var items = new List<string>();
        var i = 0;
        foreach (var item in Hijos(lista))
        {
            var tarea = Tipo(item) == "taskItem";
            var marcado = Attrs(item) is { ValueKind: JsonValueKind.Object } a && a.TryGetProperty("checked", out var c) && c.ValueKind == JsonValueKind.True;
            var marca = tarea ? (marcado ? "- [x] " : "- [ ] ") : ordenada ? (inicio + i).ToString(CultureInfo.InvariantCulture) + ". " : "- ";
            var sangria = tarea ? 2 : marca.Length;
            var lineas = CuerpoItem(item).Split('\n');
            var salida = lineas.Skip(1).Select(l => l.Length == 0 ? "" : new string(' ', sangria) + l);
            items.Add(lineas.Length == 1 && lineas[0].Length == 0 ? marca.TrimEnd() : string.Join("\n", salida.Prepend(marca + lineas[0])));
            i++;
        }
        return string.Join("\n", items);
    }

    private static string CuerpoItem(JsonElement item)
    {
        var sb = new StringBuilder();
        var previo = "";
        foreach (var h in Hijos(item))
        {
            var s = Bloque(h);
            if (s.Length == 0) continue;
            var tipo = Tipo(h);
            if (sb.Length > 0) sb.Append(EsLista(tipo) ? (tipo == previo ? SeparadorListas : "\n") : "\n\n");
            sb.Append(s);
            previo = tipo;
        }
        return sb.ToString();
    }

    private static string Tabla(JsonElement n)
    {
        var filas = Hijos(n).Where(r => Tipo(r) == "tableRow").Select(r => Hijos(r).Select(Celda).ToList()).ToList();
        var cols = filas.Count == 0 ? 0 : filas.Max(f => f.Count);
        if (cols == 0) return "";
        string Fila(List<string> f) => "| " + string.Join(" | ", f.Concat(Enumerable.Repeat("", cols - f.Count))) + " |";
        var salida = new List<string> { Fila(filas[0]), "| " + string.Join(" | ", Enumerable.Repeat("---", cols)) + " |" };
        salida.AddRange(filas.Skip(1).Select(Fila));
        return string.Join("\n", salida);
    }

    private static string Celda(JsonElement celda) =>
        string.Join(" ", Hijos(celda).Select(Bloque).Where(s => s.Length > 0)).Replace("\\\n", " ").Replace("\n", " ").Replace("|", "\\|").Trim();

    // ---------- en línea

    private static string Inline(JsonElement padre)
    {
        var sb = new StringBuilder();
        foreach (var s in Hijos(padre).Select(InlineNodo))
        {
            // Delimitadores contiguos ("*a*" + "**b**") se pegarían: un comentario HTML vacío los separa.
            if (sb.Length > 0 && s.Length > 0 && (sb[^1] is '*' or '~') && s[0] == sb[^1]) sb.Append("<!---->");
            sb.Append(s);
        }
        return sb.ToString();
    }

    private static string SinSaltoFinal(string s)
    {
        while (s.EndsWith("\\\n", StringComparison.Ordinal)) s = s[..^2];
        return s;
    }

    private static string InlineNodo(JsonElement n) => Tipo(n) switch
    {
        "text" => Texto(n),
        "hardBreak" => "\\\n",
        "image" => Imagen(n),
        _ => Inline(n)
    };

    private static string Texto(JsonElement n)
    {
        var t = (Cadena(n, "text") ?? "").Replace("\r\n", "\n").Replace('\r', '\n');
        var nucleo = t.Trim();
        if (nucleo.Length == 0) return t;
        var inicio = t[..(t.Length - t.TrimStart().Length)];
        var fin = t[t.TrimEnd().Length..];

        bool codigo = false, negrita = false, cursiva = false, tachado = false;
        string? href = null;
        if (n.TryGetProperty("marks", out var marcas) && marcas.ValueKind == JsonValueKind.Array)
            foreach (var m in marcas.EnumerateArray())
                switch (Tipo(m))
                {
                    case "code": codigo = true; break;
                    case "bold": negrita = true; break;
                    case "italic": cursiva = true; break;
                    case "strike": tachado = true; break;
                    case "link": href = Url(Cadena(Attrs(m), "href")); break;
                }

        string s;
        if (codigo)
        {
            var cerca = new string('`', MaxCorrida(nucleo, '`') + 1);
            s = nucleo.StartsWith('`') || nucleo.EndsWith('`') ? $"{cerca} {nucleo} {cerca}" : cerca + nucleo + cerca;
        }
        else s = Escapar(nucleo);
        if (negrita) s = "**" + s + "**";
        if (cursiva) s = "*" + s + "*";
        if (tachado) s = "~~" + s + "~~";
        if (href is not null) s = $"[{s}]({href})";
        return inicio + s + fin;
    }

    private static string Escapar(string s)
    {
        var sb = new StringBuilder(s.Length);
        foreach (var c in s)
        {
            if (c is '\\' or '`' or '*' or '_' or '[' or ']' or '<' or '~') sb.Append('\\');
            sb.Append(c);
        }
        return sb.ToString();
    }

    private static string? Url(string? href)
    {
        href = href?.Trim();
        if (string.IsNullOrEmpty(href) || !Esquemas.Any(e => href.StartsWith(e, StringComparison.OrdinalIgnoreCase))
            || !Uri.TryCreate(href, UriKind.Absolute, out _)) return null;
        var sb = new StringBuilder();
        foreach (var c in href)
            if (c is ' ' or '(' or ')' or '<' or '>' or < ' ') sb.Append('%').Append(((int)c).ToString("X2", CultureInfo.InvariantCulture));
            else sb.Append(c);
        return sb.ToString();
    }

    private static string Imagen(JsonElement n)
    {
        var a = Attrs(n);
        if (!Guid.TryParse(Cadena(a, "attachmentId"), out var id)) return "";
        return $"![{Escapar((Cadena(a, "alt") ?? "").Replace("\r\n", " ").Replace('\n', ' ').Replace('\r', ' '))}](attachment:{id.ToString("D")})";
    }

    /// <summary>Escapa lo que al inicio de una línea abriría un encabezado, cita, lista o separador.</summary>
    private static string InicioDeLinea(string s) => InicioLinea().Replace(EspaciosIniciales().Replace(s, ""), m =>
        m.Groups[1].Success ? "\\" + m.Value : m.Groups[2].Value + "\\" + m.Groups[3].Value);

    [GeneratedRegex(@"^[ \t]+", RegexOptions.Multiline)]
    private static partial Regex EspaciosIniciales();

    [GeneratedRegex(@"^(?:([#>+=-])|(\d+)([.)]))", RegexOptions.Multiline)]
    private static partial Regex InicioLinea();
}
