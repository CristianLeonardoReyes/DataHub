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
    public void Mensaje_lleva_logo_inline_y_html_con_cid_y_enlace_codificado()
    {
        var html = PlantillasCorreo.Invitacion("https://x.test/a?t=1&u=2");
        var m = EnviadorCorreoSes.CrearMensaje(Opciones(), "u@test.co", "Hola", html);

        var recurso = Assert.Single(m.BodyParts, p => p.ContentId == "logo-datahub");
        Assert.Equal("image/png", recurso.ContentType.MimeType);
        Assert.Contains("cid:logo-datahub", m.HtmlBody);
        Assert.Contains("https://x.test/a?t=1&amp;u=2", m.HtmlBody);
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

    [Fact]
    public async Task Modo_archivo_embebe_el_logo_como_data_uri()
    {
        var carpeta = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        try
        {
            await new DataGlobal.DataHub.Services.Correo.EnviadorCorreoArchivo(carpeta)
                .EnviarAsync("a@b.co", "Prueba", DataGlobal.DataHub.Services.Correo.PlantillasCorreo.Invitacion("https://x.test/?token=1"));
            var html = await File.ReadAllTextAsync(Assert.Single(Directory.GetFiles(carpeta)), TestContext.Current.CancellationToken);
            Assert.Contains("data:image/png;base64,", html);
            Assert.DoesNotContain("cid:", html);
        }
        finally { if (Directory.Exists(carpeta)) Directory.Delete(carpeta, true); }
    }
}
