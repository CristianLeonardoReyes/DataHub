using DataGlobal.DataHub.Services.Seguridad;

namespace DataGlobal.DataHub.Tests.Unit;

public class SeguridadTests
{
    [Fact]
    public void Contrasena_de_9_falla_y_de_10_pasa()
    {
        Assert.NotNull(ValidadorContrasena.Validar(new string('a', 9)));
        Assert.Null(ValidadorContrasena.Validar(new string('a', 10)));
        Assert.NotNull(ValidadorContrasena.Validar(new string('a', 129)));
    }

    [Fact]
    public void Hash_de_token_coincide_con_SHA2_de_MySQL()
    {
        // SHA2('abc', 256)
        Assert.Equal("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", TokenUtil.Hash("abc"));
    }

    [Fact]
    public void Token_generado_es_hex_de_64_y_distinto()
    {
        var a = TokenUtil.Generar();
        var b = TokenUtil.Generar();
        Assert.Matches("^[0-9a-f]{64}$", a);
        Assert.NotEqual(a, b);
    }
}
