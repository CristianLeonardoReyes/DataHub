namespace DataGlobal.DataHub.Services.Almacen;

/// <summary>Almacenamiento privado de archivos (Azure Blob; Azurite en desarrollo y pruebas).</summary>
public interface IAlmacenArchivos
{
    Task SubirAsync(string ruta, Stream contenido, string tipoMime);
    /// <summary>Borra el blob si existe (limpieza de una subida fallida).</summary>
    Task BorrarAsync(string ruta);
    /// <summary>URL de solo lectura que vence en <paramref name="expira"/>; fija ContentType y ContentDisposition de la respuesta.</summary>
    string UrlLectura(string ruta, DateTimeOffset expira, string tipoMime, string contentDisposition);
}
