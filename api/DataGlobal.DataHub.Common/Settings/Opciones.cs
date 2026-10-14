namespace DataGlobal.DataHub.Common.Settings;

public class JwtOpciones
{
    public string Clave { get; set; } = "";
    public string Emisor { get; set; } = "";
    public string Audiencia { get; set; } = "";
    public int Minutos { get; set; } = 60;
}

public class CorreoOpciones
{
    /// <summary>Archivo | Ses</summary>
    public string Modo { get; set; } = "Archivo";
    public string? Carpeta { get; set; }
    public string Remitente { get; set; } = "";
    public string Region { get; set; } = "";
}

public class AppOpciones
{
    public string UrlBase { get; set; } = "";
}
