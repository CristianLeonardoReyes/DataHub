using DataGlobal.DataHub.Common.Util;

namespace DataGlobal.DataHub.Tests.Unit;

public class SlugTests
{
    [Theory]
    [InlineData("Guía de Instalación", "guia-de-instalacion")]
    [InlineData("  Año Nuevo -- 2026!  ", "ano-nuevo-2026")]
    [InlineData("API v2 / REST", "api-v2-rest")]
    [InlineData("¿¡?!", "sin-nombre")]
    [InlineData("", "sin-nombre")]
    public void Genera_slug(string texto, string esperado) => Assert.Equal(esperado, Slug.De(texto));

    [Fact]
    public void Limita_a_200_caracteres() => Assert.Equal(200, Slug.De(new string('a', 300)).Length);
}
