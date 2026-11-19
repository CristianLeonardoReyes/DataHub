using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace DataGlobal.DataHub.Services.Almacen;

/// <summary>El cliente se crea en el primer uso, así la API arranca sin cadena de conexión (p. ej. en pruebas ajenas a archivos).</summary>
public class AlmacenAzureBlob(string cadenaConexion, string contenedor) : IAlmacenArchivos
{
    private readonly Lazy<BlobContainerClient> _contenedor = new(() => new BlobContainerClient(cadenaConexion, contenedor));
    private volatile bool _creado;

    public async Task SubirAsync(string ruta, Stream contenido, string tipoMime)
    {
        var c = _contenedor.Value;
        if (!_creado)
        {
            await c.CreateIfNotExistsAsync(PublicAccessType.None);
            _creado = true;
        }
        await c.GetBlobClient(ruta).UploadAsync(contenido, new BlobUploadOptions { HttpHeaders = new() { ContentType = tipoMime } });
    }

    public async Task BorrarAsync(string ruta) => await _contenedor.Value.GetBlobClient(ruta).DeleteIfExistsAsync();

    public string UrlLectura(string ruta, DateTimeOffset expira, string tipoMime, string contentDisposition)
    {
        var blob = _contenedor.Value.GetBlobClient(ruta);
        var sas = new BlobSasBuilder(BlobSasPermissions.Read, expira)
        {
            BlobContainerName = blob.BlobContainerName,
            BlobName = blob.Name,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-1), // holgura ante diferencias de reloj
            ContentType = tipoMime,
            ContentDisposition = contentDisposition
        };
        return blob.GenerateSasUri(sas).ToString();
    }
}
