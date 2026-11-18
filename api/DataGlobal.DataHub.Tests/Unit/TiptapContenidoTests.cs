using System.Text.Json;
using DataGlobal.DataHub.Common.Models;
using DataGlobal.DataHub.Common.Util;

namespace DataGlobal.DataHub.Tests.Unit;

public class TiptapContenidoTests
{
    private static JsonElement J(string json) => JsonDocument.Parse(json).RootElement;

    [Fact]
    public void Extrae_parrafos_encabezados_y_marcas()
    {
        var doc = J("""
        {"type":"doc","content":[
          {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Título"}]},
          {"type":"paragraph"},
          {"type":"paragraph","content":[{"type":"text","text":"Hola ","marks":[{"type":"bold"}]},{"type":"text","text":"mundo","marks":[{"type":"link","attrs":{"href":"https://a.co"}}]}]}
        ]}
        """);
        Assert.Equal("Título\nHola mundo", TiptapContenido.Extraer(doc));
    }

    [Fact]
    public void Extrae_listas_tablas_y_codigo()
    {
        var doc = J("""
        {"type":"doc","content":[
          {"type":"bulletList","content":[
            {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"uno"}]}]},
            {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"dos"}]}]}]},
          {"type":"taskList","content":[{"type":"taskItem","content":[{"type":"paragraph","content":[{"type":"text","text":"tarea"}]}]}]},
          {"type":"table","content":[{"type":"tableRow","content":[
            {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"A"}]}]},
            {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"B"}]}]}]}]},
          {"type":"codeBlock","content":[{"type":"text","text":"var x = 1;\nvar y = 2;"}]},
          {"type":"paragraph","content":[{"type":"text","text":"a"},{"type":"hardBreak"},{"type":"text","text":"b"}]}
        ]}
        """);
        Assert.Equal("uno\ndos\ntarea\nA\nB\nvar x = 1;\nvar y = 2;\na\nb", TiptapContenido.Extraer(doc));
    }

    [Fact]
    public void Extrae_vacio_y_no_usa_campos_ajenos()
    {
        Assert.Equal("", TiptapContenido.Extraer(J("""{"type":"doc"}""")));
        Assert.Equal("", TiptapContenido.Extraer(J("""{"type":"doc","textoPlano":"inyectado","content":[{"type":"paragraph"}]}""")));
    }

    [Theory]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"https://a.co"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"mailto:a@b.co"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"image","attrs":{"attachmentId":"3f2504e0-4f89-11d3-9a0c-0305e82c3301","alt":"x"}}]}""")]
    [InlineData("""{"type":"doc"}""")]
    public void Valida_documentos_correctos(string json) => TiptapContenido.Validar(J(json));

    [Theory]
    [InlineData("""{"type":"paragraph"}""")]
    [InlineData("""[]""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"data:text/html,x"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"/relativo"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"JAVASCRIPT:alert(1)"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"  javascript:alert(1)"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"java\tscript:alert(1)"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"vbscript:x"}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":123}}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link"}]}]}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"image","attrs":{"src":"https://x/y.png"}}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"image","attrs":{"attachmentId":"3f2504e0-4f89-11d3-9a0c-0305e82c3301","src":"x"}}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"image","attrs":{"attachmentId":"nope"}}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"image"}]}""")]
    public void Rechaza_documentos_invalidos(string json) =>
        Assert.Throws<SolicitudInvalidaException>(() => TiptapContenido.Validar(J(json)));

    [Fact]
    public void Rechaza_mas_de_2_MB() =>
        Assert.Throws<SolicitudInvalidaException>(() =>
            TiptapContenido.Validar(J($$"""{"type":"doc","content":[{"type":"text","text":"{{new string('a', TiptapContenido.MaxBytes)}}"}]}""")));
}
