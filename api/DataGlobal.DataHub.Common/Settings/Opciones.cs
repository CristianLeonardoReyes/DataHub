namespace DataGlobal.DataHub.Common.Settings;

public class JwtOpciones
{
    public string Clave { get; set; } = "";
    public string Emisor { get; set; } = "";
    public string Audiencia { get; set; } = "";
    public int MinutosInactividad { get; set; } = 60;
    public int HorasMaximas { get; set; } = 8;
    public int DiasRecordarme { get; set; } = 7;
}

public class CorreoOpciones
{
    /// <summary>Archivo | Ses</summary>
    public string Modo { get; set; } = "Archivo";
    public string? Carpeta { get; set; }
}

/// <summary>Sección estándar de la empresa para Amazon SES. Las llaves van solo en user-secrets / App Settings.</summary>
public class SesEmailSettings
{
    public string Region { get; set; } = "";
    public string Aws_from_address { get; set; } = "";
    public string Aws_replyto_address { get; set; } = "";
    public string Aws_from_name { get; set; } = "";
    public string Aws_access_key { get; set; } = "";
    public string Aws_secret_key { get; set; } = "";
    public List<string> Aws_bcc_addresses { get; set; } = [];
}

public class AppOpciones
{
    public string UrlBase { get; set; } = "";
}
