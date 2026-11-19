using DataGlobal.DataHub.Common.Util;

namespace DataGlobal.DataHub.Tests.Unit;

public class ConsultaBusquedaTests
{
    [Theory]
    [InlineData("arquitectura", "+arquitectura*", "arquitectura")]
    [InlineData("  Guía  de   API ", "+Guía* +API*", "Guía")]
    [InlineData("+uno -dos ~tres (cuatro) \"cinco\" <seis> @siete *ocho", "+uno* +dos* +tres* +cuatro* +cinco* +seis* +siete* +ocho*", "uno")]
    [InlineData("node.js a b cd", "+node* +js* +cd*", "node")]
    [InlineData("Manual de usuario", "+Manual* +usuario*", "Manual")]
    [InlineData("the API of THE system", "+API* +system*", "API")]
    public void Prepara_terminos_obligatorios_con_prefijo(string texto, string consulta, string primero) =>
        Assert.Equal((consulta, primero), ConsultaBusqueda.Preparar(texto));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("a")]
    [InlineData("+a -b ~c (d) \"e\" *")]
    [InlineData("@@@")]
    [InlineData("de")]
    [InlineData("The of WITH")]
    public void Sin_terminos_validos_devuelve_null(string? texto) => Assert.Null(ConsultaBusqueda.Preparar(texto));

    [Fact]
    public void Limita_a_8_terminos_y_100_caracteres()
    {
        var (consulta, _) = ConsultaBusqueda.Preparar("aa bb cc dd ee ff gg hh ii jj")!.Value;
        Assert.Equal(8, consulta.Split(' ').Length);
        Assert.Equal("+aaaa*", ConsultaBusqueda.Preparar("aaaa" + new string(' ', 95) + "bbbb")!.Value.Consulta);
    }
}
