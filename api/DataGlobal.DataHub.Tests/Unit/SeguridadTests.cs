using DataGlobal.DataHub.Services.Seguridad;

namespace DataGlobal.DataHub.Tests.Unit;

public class SeguridadTests
{
    [Fact]
    public void Contrasena_exige_10_caracteres_mayuscula_minuscula_numero_y_simbolo()
    {
        Assert.Null(ValidadorContrasena.Validar("Clave@2026"));
        Assert.NotNull(ValidadorContrasena.Validar("Cla@2026")); // corta
        Assert.NotNull(ValidadorContrasena.Validar("clave@2026x")); // sin mayúscula
        Assert.NotNull(ValidadorContrasena.Validar("CLAVE@2026X")); // sin minúscula
        Assert.NotNull(ValidadorContrasena.Validar("Clave@Segura")); // sin número
        Assert.NotNull(ValidadorContrasena.Validar("ClaveSegura123")); // sin símbolo
        Assert.NotNull(ValidadorContrasena.Validar("Clave 2026ab")); // el espacio no cuenta como símbolo
        Assert.NotNull(ValidadorContrasena.Validar("Aa1@" + new string('a', 125)));
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
