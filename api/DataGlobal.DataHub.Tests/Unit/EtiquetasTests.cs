using DataGlobal.DataHub.Common.Util;

namespace DataGlobal.DataHub.Tests.Unit;

public class EtiquetasTests
{
    [Fact]
    public void Normaliza_trim_espacios_y_minusculas()
    {
        Assert.Equal("backend api", Etiquetas.Normalizar("  Backend \t API "));
        Assert.Equal("", Etiquetas.Normalizar((string?)null));
    }

    [Fact]
    public void Descarta_vacias_y_duplicadas_conservando_el_orden()
    {
        Assert.Equal(["zeta", "alfa"], Etiquetas.Normalizar(["Zeta", " ", "alfa", "ZETA", null]));
        Assert.Empty(Etiquetas.Normalizar((IEnumerable<string?>?)null));
    }
}
