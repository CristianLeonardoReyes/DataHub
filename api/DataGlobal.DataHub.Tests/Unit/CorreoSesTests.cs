using DataGlobal.DataHub.Common.Settings;
using DataGlobal.DataHub.Services.Correo;

namespace DataGlobal.DataHub.Tests.Unit;

public class CorreoSesTests
{
    private static SesEmailSettings Opciones(params string[] bcc) => new()
    {
        Region = "us-east-2",
        Aws_from_address = "no-responder@dataglobal.co",
        Aws_replyto_address = "servicioalcliente@dataglobal.co",
        Aws_from_name = "DataHub Service",
        Aws_bcc_addresses = [.. bcc]
    };

    [Fact]
    public void Mensaje_tiene_from_replyto_to_asunto_y_html()
    {
        var m = EnviadorCorreoSes.CrearMensaje(Opciones(), "u@test.co", "Hola", "<p>x</p>");

        var from = Assert.Single(m.From.Mailboxes);
        Assert.Equal("DataHub Service", from.Name);
        Assert.Equal("no-responder@dataglobal.co", from.Address);
        Assert.Equal("servicioalcliente@dataglobal.co", Assert.Single(m.ReplyTo.Mailboxes).Address);
        Assert.Equal("u@test.co", Assert.Single(m.To.Mailboxes).Address);
        Assert.Equal("Hola", m.Subject);
        Assert.Equal("<p>x</p>", m.HtmlBody);
    }

    [Fact]
    public void Sin_bcc_si_la_lista_esta_vacia_o_tiene_cadenas_vacias()
    {
        Assert.Empty(EnviadorCorreoSes.CrearMensaje(Opciones(), "u@test.co", "a", "b").Bcc);
        Assert.Empty(EnviadorCorreoSes.CrearMensaje(Opciones("", " "), "u@test.co", "a", "b").Bcc);
    }

    [Fact]
    public void Bcc_con_dos_direcciones()
    {
        var m = EnviadorCorreoSes.CrearMensaje(Opciones("a@test.co", "b@test.co"), "u@test.co", "a", "b");

        Assert.Equal(["a@test.co", "b@test.co"], m.Bcc.Mailboxes.Select(x => x.Address));
    }

    [Fact]
    public async Task Modo_ses_sin_from_address_no_arranca()
    {
        await using var factory = new ApiFactory().WithWebHostBuilder(b =>
        {
            b.UseSetting("Correo:Modo", "Ses");
            b.UseSetting("SesEmailSettings:Region", "us-east-2");
            b.UseSetting("SesEmailSettings:Aws_from_address", "");
        });

        var ex = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains("Aws_from_address", ex.ToString());
    }

    [Fact]
    public async Task Modo_archivo_arranca_sin_configuracion_ses()
    {
        await using var factory = new ApiFactory().WithWebHostBuilder(b =>
        {
            b.UseSetting("SesEmailSettings:Region", "");
            b.UseSetting("SesEmailSettings:Aws_from_address", "");
        });
        using var client = factory.CreateClient();

        var resp = await client.GetAsync("/health", TestContext.Current.CancellationToken);

        Assert.Equal(System.Net.HttpStatusCode.OK, resp.StatusCode);
    }
}
