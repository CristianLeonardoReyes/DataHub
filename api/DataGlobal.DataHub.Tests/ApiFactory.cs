using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace DataGlobal.DataHub.Tests;

/// <summary>API con configuración de prueba: JWT fijo, correos a una carpeta temporal.</summary>
public class ApiFactory(string? connectionString = null, string? blobConnectionString = null, int? archivosMaxMb = null) : WebApplicationFactory<Program>
{
    public const string ContenedorArchivos = "adjuntos-test";
    public string CarpetaCorreos { get; } = Path.Combine(Path.GetTempPath(), "datahub-correos-" + Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:Clave", new string('k', 48));
        builder.UseSetting("Jwt:Emisor", "datahub-test");
        builder.UseSetting("Jwt:Audiencia", "datahub-test");
        builder.UseSetting("Jwt:MinutosInactividad", "60");
        builder.UseSetting("Jwt:HorasMaximas", "8");
        builder.UseSetting("Jwt:DiasRecordarme", "7");
        builder.UseSetting("Correo:Modo", "Archivo");
        builder.UseSetting("Correo:Carpeta", CarpetaCorreos);
        builder.UseSetting("App:UrlBase", "http://localhost:5173");
        if (connectionString is not null) builder.UseSetting("ConnectionStrings:DataHub", connectionString);
        if (blobConnectionString is not null) builder.UseSetting("ConnectionStrings:AzureBlobStorage", blobConnectionString);
        if (archivosMaxMb is { } mb) builder.UseSetting("Archivos:TamanoMaximoMb", mb.ToString());
        builder.UseSetting("Archivos:Contenedor", ContenedorArchivos);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && Directory.Exists(CarpetaCorreos)) Directory.Delete(CarpetaCorreos, true);
    }
}
