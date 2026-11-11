using System.Text.RegularExpressions;

namespace DataGlobal.DataHub.Services.Correo;

/// <summary>Desarrollo: escribe cada correo como .html en una carpeta.</summary>
public partial class EnviadorCorreoArchivo(string carpeta) : IEnviadorCorreo
{
    public async Task EnviarAsync(string destino, string asunto, string html)
    {
        Directory.CreateDirectory(carpeta);
        var nombre = $"{DateTime.UtcNow:yyyyMMdd-HHmmss-fff}_{NoAlfanumerico().Replace(asunto, "-").Trim('-')}.html";
        // Un .html local no resuelve cid:, así que el logo va como data URI.
        html = html.Replace($"cid:{PlantillasCorreo.LogoCid}", $"data:image/png;base64,{Convert.ToBase64String(PlantillasCorreo.LogoPng)}");
        await File.WriteAllTextAsync(Path.Combine(carpeta, nombre), $"<!-- Para: {destino} -->\n{html}");
    }

    [GeneratedRegex("[^a-zA-Z0-9]+")]
    private static partial Regex NoAlfanumerico();
}
