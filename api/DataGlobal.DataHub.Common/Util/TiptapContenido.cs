using System.Text;
using System.Text.Json;
using DataGlobal.DataHub.Common.Models;

namespace DataGlobal.DataHub.Common.Util;

/// <summary>Validación del documento Tiptap que llega del cliente y extracción de su texto plano en el servidor.</summary>
public static class TiptapContenido
{
    /// <summary>Tamaño máximo del documento serializado (RF-EDI-03).</summary>
    public const int MaxBytes = 2 * 1024 * 1024;

    private static readonly string[] EsquemasPermitidos = ["http", "https", "mailto"];

    // Nodos que cierran una línea en el texto plano.
    private static readonly HashSet<string> Bloques =
    [
        "doc", "paragraph", "heading", "blockquote", "codeBlock", "bulletList", "orderedList", "taskList",
        "listItem", "taskItem", "table", "tableRow", "tableCell", "tableHeader", "horizontalRule"
    ];

    // La profundidad la limita el MaxDepth del deserializador JSON (64 por defecto): el body se rechaza con 400 antes de llegar aquí.
    public static void Validar(JsonElement doc)
    {
        if (doc.ValueKind != JsonValueKind.Object || Texto(doc, "type") != "doc")
            throw new SolicitudInvalidaException("El contenido debe ser un documento con type \"doc\".");
        if (Encoding.UTF8.GetByteCount(doc.GetRawText()) > MaxBytes)
            throw new SolicitudInvalidaException("El contenido supera el tamaño máximo de 2 MB.");
        Recorrer(doc);
    }

    private static void Recorrer(JsonElement nodo)
    {
        if (nodo.ValueKind != JsonValueKind.Object) throw new SolicitudInvalidaException("El contenido tiene un nodo inválido.");
        if (Texto(nodo, "type") == "image")
        {
            var attrs = nodo.TryGetProperty("attrs", out var a) && a.ValueKind == JsonValueKind.Object ? a : default;
            if (attrs.ValueKind == JsonValueKind.Object && attrs.TryGetProperty("src", out _))
                throw new SolicitudInvalidaException("Las imágenes no pueden llevar src; usa attachmentId.");
            if (!Guid.TryParse(Texto(attrs, "attachmentId"), out _))
                throw new SolicitudInvalidaException("Cada imagen debe tener un attachmentId válido.");
        }
        if (nodo.TryGetProperty("marks", out var marcas) && marcas.ValueKind == JsonValueKind.Array)
            foreach (var m in marcas.EnumerateArray().Where(m => Texto(m, "type") == "link"))
            {
                var href = m.TryGetProperty("attrs", out var at) ? Texto(at, "href") : null;
                if (href is null || !Uri.TryCreate(href, UriKind.Absolute, out var uri) || !EsquemasPermitidos.Contains(uri.Scheme))
                    throw new SolicitudInvalidaException("Los enlaces solo pueden usar http, https o mailto.");
            }
        if (nodo.TryGetProperty("content", out var hijos) && hijos.ValueKind == JsonValueKind.Array)
            foreach (var h in hijos.EnumerateArray()) Recorrer(h);
    }

    /// <summary>Texto plano del documento: concatena los nodos de texto y separa los bloques con salto de línea.</summary>
    public static string Extraer(JsonElement doc)
    {
        var sb = new StringBuilder();
        Escribir(doc, sb);
        return sb.ToString().TrimEnd('\n');
    }

    private static void Escribir(JsonElement nodo, StringBuilder sb)
    {
        if (nodo.ValueKind != JsonValueKind.Object) return;
        var tipo = Texto(nodo, "type");
        if (tipo == "text") sb.Append(Texto(nodo, "text"));
        else if (tipo == "hardBreak") sb.Append('\n');
        if (nodo.TryGetProperty("content", out var hijos) && hijos.ValueKind == JsonValueKind.Array)
            foreach (var h in hijos.EnumerateArray()) Escribir(h, sb);
        if (tipo is not null && Bloques.Contains(tipo) && sb.Length > 0 && sb[^1] != '\n') sb.Append('\n');
    }

    private static string? Texto(JsonElement o, string propiedad) =>
        o.ValueKind == JsonValueKind.Object && o.TryGetProperty(propiedad, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
}
