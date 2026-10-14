using System.Net;

namespace DataGlobal.DataHub.Services.Correo;

public static class PlantillasCorreo
{
    public const string AsuntoRestablecer = "Restablece tu contraseña de DataHub";
    public const string AsuntoInvitacion = "Te invitaron a DataHub";

    public static string Restablecer(string enlace) => Cuerpo(
        "Restablece tu contraseña",
        "Recibimos una solicitud para restablecer tu contraseña. El enlace vence en 1 hora y solo se puede usar una vez.",
        enlace, "Restablecer contraseña",
        "Si no fuiste tú, ignora este correo.");

    public static string Invitacion(string enlace) => Cuerpo(
        "Te invitaron a DataHub",
        "Crea tu contraseña para activar tu cuenta. El enlace vence en 72 horas y solo se puede usar una vez.",
        enlace, "Aceptar invitación",
        "Si no esperabas esta invitación, ignora este correo.");

    private static string Cuerpo(string titulo, string texto, string enlace, string boton, string pie)
    {
        var url = WebUtility.HtmlEncode(enlace);
        return $"""
            <!DOCTYPE html>
            <html lang="es"><body style="font-family:Arial,sans-serif;color:#222">
            <h2>{titulo}</h2>
            <p>{texto}</p>
            <p><a href="{url}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">{boton}</a></p>
            <p style="font-size:12px;color:#666">Si el botón no funciona, copia este enlace en tu navegador:<br>{url}</p>
            <p style="font-size:12px;color:#666">{pie}</p>
            </body></html>
            """;
    }
}
