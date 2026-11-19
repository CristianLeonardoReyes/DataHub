using System.Net;

namespace DataGlobal.DataHub.Tests.Integration;

/// <summary>RNF-04: cabeceras de seguridad en todas las respuestas.</summary>
public class CabecerasSeguridadTests(AzuriteFixture azurite) : IClassFixture<AzuriteFixture>
{
    [Theory]
    [InlineData("/health", HttpStatusCode.OK)]
    [InlineData("/api/v1/auth/me", HttpStatusCode.Unauthorized)]
    public async Task Respuestas_llevan_nosniff_no_referrer_y_csp_con_el_origen_del_blob(string ruta, HttpStatusCode esperado)
    {
        using var factory = new ApiFactory(blobConnectionString: azurite.ConnectionString);
        using var http = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        var r = await http.GetAsync(ruta, TestContext.Current.CancellationToken);

        Assert.Equal(esperado, r.StatusCode);
        Assert.Equal("nosniff", r.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("no-referrer", r.Headers.GetValues("Referrer-Policy").Single());
        var csp = r.Headers.GetValues("Content-Security-Policy").Single();
        Assert.Contains("frame-ancestors 'none'", csp);
        Assert.Contains("object-src 'none'", csp);
        var origen = new Uri(azurite.ConnectionString.Split(';').First(p => p.StartsWith("BlobEndpoint=")).Split('=', 2)[1]).GetLeftPart(UriPartial.Authority);
        Assert.Matches($@"img-src [^;]*{System.Text.RegularExpressions.Regex.Escape(origen)}", csp);
    }
}
