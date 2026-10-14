using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace DataGlobal.DataHub.Tests;

/// <summary>API con configuración de prueba: JWT fijo, correos a una carpeta temporal.</summary>
public class ApiFactory(string? connectionString = null) : WebApplicationFactory<Program>
{
    public string CarpetaCorreos { get; } = Path.Combine(Path.GetTempPath(), "datahub-correos-" + Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:Clave", new string('k', 48));
        builder.UseSetting("Jwt:Emisor", "datahub-test");
        builder.UseSetting("Jwt:Audiencia", "datahub-test");
        builder.UseSetting("Correo:Modo", "Archivo");
        builder.UseSetting("Correo:Carpeta", CarpetaCorreos);
        builder.UseSetting("App:UrlBase", "http://localhost:5173");
        if (connectionString is not null) builder.UseSetting("ConnectionStrings:DataHub", connectionString);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && Directory.Exists(CarpetaCorreos)) Directory.Delete(CarpetaCorreos, true);
    }
}
