using System.Text.Json;
using DataGlobal.DataHub.Common.Util;

namespace DataGlobal.DataHub.Tests.Unit;

public class MarkdownTiptapTests
{
    private static string Md(string contenidoJson) =>
        MarkdownTiptap.Serializar(JsonDocument.Parse($$"""{"type":"doc","content":{{contenidoJson}}}""").RootElement);

    private static string T(string texto, string marks = "") =>
        $$"""{"type":"text","text":{{JsonSerializer.Serialize(texto)}}{{(marks.Length == 0 ? "" : $",\"marks\":[{marks}]")}}}""";

    private static string P(params string[] hijos) => $$"""{"type":"paragraph","content":[{{string.Join(",", hijos)}}]}""";
    private static string Nodo(string tipo, string attrs, params string[] hijos) =>
        $$"""{"type":"{{tipo}}"{{(attrs.Length == 0 ? "" : $",\"attrs\":{attrs}")}},"content":[{{string.Join(",", hijos)}}]}""";
    private static string Mark(string tipo) => $$"""{"type":"{{tipo}}"}""";

    private static string Cuerpo(params string[] bloques) => Md("[" + string.Join(",", bloques) + "]");

    [Fact]
    public void Encabezados_y_parrafos()
    {
        Assert.Equal("# Uno\n\n## Dos\n\n### Tres\n\nTexto\n\nOtro\n",
            Cuerpo(Nodo("heading", """{"level":1}""", T("Uno")), Nodo("heading", """{"level":2}""", T("Dos")),
                Nodo("heading", """{"level":3}""", T("Tres")), P(T("Texto")), P(T("Otro"))));
    }

    [Fact]
    public void Marks_basicas()
    {
        Assert.Equal("**a** *b* ~~c~~ `d`\n", Cuerpo(P(T("a", Mark("bold")), T(" "), T("b", Mark("italic")), T(" "), T("c", Mark("strike")), T(" "), T("d", Mark("code")))));
        Assert.Equal("***ab***\n", Cuerpo(P(T("ab", Mark("bold") + "," + Mark("italic")))));
    }

    [Fact]
    public void Marks_no_envuelven_espacios_de_los_bordes() =>
        Assert.Equal("x  **hola** y\n", Cuerpo(P(T("x "), T(" hola ", Mark("bold")), T("y"))));

    [Fact]
    public void Enlace_http_mailto_y_esquema_no_permitido()
    {
        static string L(string href) => $$$"""{"type":"link","attrs":{"href":"{{{href}}}"}}""";
        Assert.Equal("[web](https://a.co/x)\n", Cuerpo(P(T("web", L("https://a.co/x")))));
        Assert.Equal("[yo](mailto:a@b.co)\n", Cuerpo(P(T("yo", L("mailto:a@b.co")))));
        Assert.Equal("malo\n", Cuerpo(P(T("malo", L("javascript:alert(1)")))));
        Assert.Equal("malo\n", Cuerpo(P(T("malo", L("data:text/html,x")))));
        Assert.Equal("[p](https://a.co/%28x%29%20y)\n", Cuerpo(P(T("p", L("https://a.co/(x) y")))));
    }

    [Fact]
    public void Escapa_caracteres_de_markdown()
    {
        Assert.Equal("a\\*b\\_c\\`d\\[e\\]\\\\f \\<g\n", Cuerpo(P(T("a*b_c`d[e]\\f <g"))));
        Assert.Equal("\\# no titulo\n\n\\- no lista\n\n1\\. no numerada\n\n\\> no cita\n",
            Cuerpo(P(T("# no titulo")), P(T("- no lista")), P(T("1. no numerada")), P(T("> no cita"))));
    }

    [Fact]
    public void Codigo_en_linea_con_backticks()
    {
        Assert.Equal("``a`b``\n", Cuerpo(P(T("a`b", Mark("code")))));
        Assert.Equal("`` `x ``\n", Cuerpo(P(T("`x", Mark("code")))));
    }

    [Fact]
    public void Listas_con_viñeta_numeradas_y_start()
    {
        static string Item(string t) => Nodo("listItem", "", P(T(t)));
        Assert.Equal("- a\n- b\n", Cuerpo(Nodo("bulletList", "", Item("a"), Item("b"))));
        Assert.Equal("3. a\n4. b\n", Cuerpo(Nodo("orderedList", """{"start":3}""", Item("a"), Item("b"))));
        Assert.Equal("1. a\n", Cuerpo(Nodo("orderedList", "", Item("a"))));
    }

    [Fact]
    public void Lista_anidada_y_parrafos_en_item()
    {
        var interna = Nodo("bulletList", "", Nodo("listItem", "", P(T("hijo"))));
        Assert.Equal("- padre\n  - hijo\n- otro\n", Cuerpo(Nodo("bulletList", "", Nodo("listItem", "", P(T("padre")), interna), Nodo("listItem", "", P(T("otro"))))));
        Assert.Equal("1. padre\n   - hijo\n", Cuerpo(Nodo("orderedList", "", Nodo("listItem", "", P(T("padre")), interna))));
        Assert.Equal("- uno\n\n  dos\n", Cuerpo(Nodo("bulletList", "", Nodo("listItem", "", P(T("uno")), P(T("dos"))))));
    }

    [Fact]
    public void Lista_de_tareas() =>
        Assert.Equal("- [ ] pendiente\n- [x] hecha\n", Cuerpo(Nodo("taskList", "",
            Nodo("taskItem", """{"checked":false}""", P(T("pendiente"))), Nodo("taskItem", """{"checked":true}""", P(T("hecha"))))));

    [Fact]
    public void Cita_con_lista_dentro_y_anidada()
    {
        var lista = Nodo("bulletList", "", Nodo("listItem", "", P(T("x"))));
        Assert.Equal("> dicho\n>\n> - x\n", Cuerpo(Nodo("blockquote", "", P(T("dicho")), lista)));
        Assert.Equal("> > hondo\n", Cuerpo(Nodo("blockquote", "", Nodo("blockquote", "", P(T("hondo"))))));
    }

    [Fact]
    public void Bloque_de_codigo_con_lenguaje_y_cerca_mas_larga()
    {
        Assert.Equal("```csharp\nvar a = 1;\n```\n", Cuerpo(Nodo("codeBlock", """{"language":"csharp"}""", T("var a = 1;"))));
        Assert.Equal("```\nx\n```\n", Cuerpo(Nodo("codeBlock", """{"language":null}""", T("x"))));
        Assert.Equal("````js\n```\nx\n```\n````\n", Cuerpo(Nodo("codeBlock", """{"language":"js"}""", T("```\nx\n```"))));
    }

    [Fact]
    public void Regla_horizontal_y_salto_duro() =>
        Assert.Equal("a\\\nb\n\n---\n", Cuerpo(P(T("a"), """{"type":"hardBreak"}""", T("b")), """{"type":"horizontalRule"}"""));

    [Fact]
    public void Tabla_gfm_con_pipe_escapado_y_filas_desiguales()
    {
        static string C(string tipo, string t) => Nodo(tipo, "", P(T(t)));
        var tabla = Nodo("table", "",
            Nodo("tableRow", "", C("tableHeader", "A"), C("tableHeader", "B")),
            Nodo("tableRow", "", C("tableCell", "x|y")));
        Assert.Equal("| A | B |\n| --- | --- |\n| x\\|y |  |\n", Cuerpo(tabla));
        // Sin tableHeader la primera fila igual es el encabezado.
        Assert.Equal("| 1 |\n| --- |\n| 2 |\n", Cuerpo(Nodo("table", "", Nodo("tableRow", "", C("tableCell", "1")), Nodo("tableRow", "", C("tableCell", "2")))));
    }

    [Fact]
    public void Imagen_usa_attachment_nunca_url()
    {
        var id = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
        Assert.Equal($"![foto \\[1\\]](attachment:{id})\n", Cuerpo($$$"""{"type":"image","attrs":{"attachmentId":"{{{id}}}","alt":"foto [1]"}}"""));
        Assert.Equal("", Cuerpo("""{"type":"image","attrs":{"attachmentId":"no-guid"}}"""));
    }

    [Fact]
    public void Nodo_desconocido_se_exporta_como_su_texto()
    {
        Assert.Equal("solo texto\n", Cuerpo(Nodo("callout", "", T("solo texto"))));
        Assert.Equal("uno\n\ndos\n", Cuerpo(Nodo("raro", "", P(T("uno")), P(T("dos")))));
    }

    [Fact]
    public void Documento_vacio_o_nulo()
    {
        Assert.Equal("", MarkdownTiptap.Serializar(null));
        Assert.Equal("", Md("[]"));
        Assert.Equal("", MarkdownTiptap.Serializar(JsonDocument.Parse("""{"type":"doc"}""").RootElement));
        Assert.Equal("", Cuerpo(P()));
    }

    [Fact]
    public void Es_deterministico_y_termina_con_un_solo_salto()
    {
        var doc = JsonDocument.Parse("{\"type\":\"doc\",\"content\":[" + Nodo("heading", "{\"level\":1}", T("T")) + "," + P(T("a", Mark("bold"))) + "," + Nodo("bulletList", "", Nodo("listItem", "", P(T("x")))) + "]}").RootElement;
        var uno = MarkdownTiptap.Serializar(doc);
        Assert.Equal(uno, MarkdownTiptap.Serializar(doc));
        Assert.EndsWith("x\n", uno);
        Assert.DoesNotContain("\r", uno);
        Assert.False(uno.EndsWith("\n\n"));
    }

    [Fact]
    public void Listas_del_mismo_tipo_seguidas_se_separan_con_comentario()
    {
        static string Item(string t) => Nodo("listItem", "", P(T(t)));
        static string Tarea(string t) => Nodo("taskItem", """{"checked":false}""", P(T(t)));
        Assert.Equal("- a\n\n<!-- -->\n\n- b\n", Cuerpo(Nodo("bulletList", "", Item("a")), Nodo("bulletList", "", Item("b"))));
        Assert.Equal("1. a\n\n<!-- -->\n\n1. b\n", Cuerpo(Nodo("orderedList", "", Item("a")), Nodo("orderedList", "", Item("b"))));
        Assert.Equal("- [ ] a\n\n<!-- -->\n\n- [ ] b\n", Cuerpo(Nodo("taskList", "", Tarea("a")), Nodo("taskList", "", Tarea("b"))));
        Assert.Equal("- a\n\n1. b\n", Cuerpo(Nodo("bulletList", "", Item("a")), Nodo("orderedList", "", Item("b"))));
        Assert.Equal("- a\n\ntexto\n\n- b\n", Cuerpo(Nodo("bulletList", "", Item("a")), P(T("texto")), Nodo("bulletList", "", Item("b"))));
        var l = Nodo("bulletList", "", Item("x"));
        Assert.Contains("<!-- -->", Cuerpo(Nodo("bulletList", "", Nodo("listItem", "", P(T("p")), l, l))));
    }

    [Fact]
    public void Espacios_iniciales_no_abren_bloques()
    {
        Assert.Equal("\\# x\n", Cuerpo(P(T("  # x"))));
        Assert.Equal("\\- x\n", Cuerpo(P(T("   - x"))));
        Assert.Equal("codigo\n", Cuerpo(P(T("      codigo"))));
        Assert.Equal("a\\\n\\> b\n", Cuerpo(P(T("a"), """{"type":"hardBreak"}""", T("  > b"))));
    }

    [Fact]
    public void Alt_de_imagen_sin_saltos_y_con_corchetes_escapados()
    {
        var id = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
        Assert.Equal($"![a b\\]](attachment:{id})\n", Cuerpo($$$"""{"type":"image","attrs":{"attachmentId":"{{{id}}}","alt":"a\nb]"}}"""));
    }

    [Fact]
    public void Salto_duro_al_final_no_deja_barra_suelta()
    {
        Assert.Equal("a\n", Cuerpo(P(T("a"), """{"type":"hardBreak"}""")));
        Assert.Equal("a\\\\\n", Cuerpo(P(T("a\\"), """{"type":"hardBreak"}""")));
        static string C(string t) => Nodo("tableCell", "", P(T(t), """{"type":"hardBreak"}"""));
        Assert.Equal("| a |\n| --- |\n| b |\n", Cuerpo(Nodo("table", "", Nodo("tableRow", "", C("a")), Nodo("tableRow", "", C("b")))));
    }

    [Fact]
    public void Start_de_lista_numerada_se_acota()
    {
        static string Item(string t) => Nodo("listItem", "", P(T(t)));
        Assert.Equal("999999999. a\n", Cuerpo(Nodo("orderedList", """{"start":2147483647}""", Item("a"))));
        Assert.Equal("999999999. a\n", Cuerpo(Nodo("orderedList", """{"start":2000000000}""", Item("a"))));
        Assert.Equal("0. a\n", Cuerpo(Nodo("orderedList", """{"start":-5}""", Item("a"))));
    }

    [Fact]
    public void Marcas_contiguas_no_se_pegan() =>
        Assert.Equal("*a*<!---->**b**\n", Cuerpo(P(T("a", Mark("italic")), T("b", Mark("bold")))));

    [Fact]
    public void Front_matter_escapa_separadores_de_linea_unicode() =>
        Assert.Contains("title: \"a\\u2028b\\u007Fc\"\n", MarkdownTiptap.FrontMatter(Datos("a" + (char)0x2028 + "b" + (char)0x7f + "c")));

    private static FrontMatterPagina Datos(string titulo = "Arquitectura API", string? owner = "juan@cliente.com", string[]? tags = null, DateOnly? revision = null) =>
        new(titulo, "aprobado", "arquitectura", "Ingeniería", "Arquitectura", "Backend", owner, tags ?? ["backend", "api"], revision,
            new DateTime(2026, 10, 6, 15, 30, 0, DateTimeKind.Utc));

    [Fact]
    public void Front_matter_completo_con_el_orden_del_prd()
    {
        const string esperado = "---\ntitle: \"Arquitectura API\"\nstatus: aprobado\ntype: arquitectura\nworkspace: \"Ingeniería\"\n"
            + "space: \"Arquitectura\"\ncollection: \"Backend\"\nowner: \"juan@cliente.com\"\ntags: [\"api\", \"backend\"]\n"
            + "review_date: 2026-12-01\nupdated_at: 2026-10-06T15:30:00Z\n---\n";
        Assert.Equal(esperado, MarkdownTiptap.FrontMatter(Datos(revision: new DateOnly(2026, 12, 1))));
    }

    [Fact]
    public void Front_matter_sin_responsable_fecha_ni_etiquetas()
    {
        var fm = MarkdownTiptap.FrontMatter(Datos(owner: null, tags: []));
        Assert.DoesNotContain("owner:", fm);
        Assert.DoesNotContain("review_date:", fm);
        Assert.Contains("\ntags: []\n", fm);
    }

    [Fact]
    public void Front_matter_cita_comillas_y_barras() =>
        Assert.Contains("title: \"Dijo \\\"hola\\\" \\\\ y: # fin\"\n", MarkdownTiptap.FrontMatter(Datos("Dijo \"hola\" \\ y: # fin")));

    [Fact]
    public void Documento_une_front_matter_y_cuerpo()
    {
        var doc = JsonDocument.Parse($$"""{"type":"doc","content":[{{P(T("hola"))}}]}""").RootElement;
        Assert.EndsWith("---\n\nhola\n", MarkdownTiptap.Documento(Datos(), doc));
        Assert.EndsWith("---\n", MarkdownTiptap.Documento(Datos(), null));
    }
}
