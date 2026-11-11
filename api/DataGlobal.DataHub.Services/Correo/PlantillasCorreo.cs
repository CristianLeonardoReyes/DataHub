using System.Net;

namespace DataGlobal.DataHub.Services.Correo;

public static class PlantillasCorreo
{
    public const string AsuntoRestablecer = "Restablece tu contraseña de DataHub";
    public const string AsuntoInvitacion = "Te invitaron a DataHub";

    public static string Restablecer(string enlace) => Cuerpo(
        "Restablece tu contraseña",
        "Recibimos una solicitud para restablecer tu contraseña. El enlace solo se puede usar una vez.",
        enlace, "Restablecer contraseña",
        "Si no fuiste tú, ignora este correo.");

    public static string Invitacion(string enlace) => Cuerpo(
        "Te invitaron a DataHub",
        "Crea tu contraseña para activar tu cuenta. El enlace solo se puede usar una vez.",
        enlace, "Aceptar invitación",
        "Si no esperabas esta invitación, ignora este correo.");

    public const string LogoCid = "logo-datahub";

    public static readonly byte[] LogoPng = CargarLogo();

    private static byte[] CargarLogo()
    {
        var asm = typeof(PlantillasCorreo).Assembly;
        var nombre = asm.GetManifestResourceNames().Single(n => n.EndsWith("logo-datahub.png"));
        using var flujo = asm.GetManifestResourceStream(nombre)!;
        using var ms = new MemoryStream();
        flujo.CopyTo(ms);
        return ms.ToArray();
    }

    private static string Cuerpo(string titulo, string texto, string enlace, string boton, string pie)
    {
        var url = WebUtility.HtmlEncode(enlace);
        const string fuente = "Inter,Arial,sans-serif";
        return $"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="color-scheme" content="light">
            <title>{titulo}</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f4f5f9;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f5f9;font-size:1px;line-height:1px;">{texto}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f5f9" style="background-color:#f4f5f9;">
            <tr><td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
            <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #e2e5ec;border-radius:12px;padding:32px;font-family:{fuente};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
            <td style="padding-right:12px;"><img src="cid:{LogoCid}" width="40" height="40" alt="DataHub" style="display:block;border:0;outline:none;border-radius:8px;"></td>
            <td style="font-family:{fuente};font-size:20px;font-weight:600;color:#12141c;">DataHub</td>
            </tr>
            </table>
            <h1 style="margin:0 0 12px;font-family:{fuente};font-size:22px;line-height:1.3;font-weight:600;color:#12141c;">{titulo}</h1>
            <p style="margin:0 0 24px;font-family:{fuente};font-size:15px;line-height:1.6;color:#555a6a;">{texto}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr><td align="center" bgcolor="#2b3a8f" style="background-color:#2b3a8f;border-radius:8px;"><a href="{url}" style="display:inline-block;padding:12px 22px;font-family:{fuente};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">{boton}</a></td></tr>
            </table>
            <p style="margin:0 0 4px;font-family:{fuente};font-size:12px;line-height:1.5;color:#555a6a;">Si el botón no funciona, copia este enlace en tu navegador:</p>
            <p style="margin:0 0 24px;font-family:{fuente};font-size:12px;line-height:1.5;color:#555a6a;word-break:break-all;"><a href="{url}" style="color:#2b3a8f;text-decoration:underline;">{url}</a></p>
            <p style="margin:0 0 24px;font-family:{fuente};font-size:13px;line-height:1.5;color:#555a6a;">{pie}</p>
            <hr style="border:0;border-top:1px solid #e2e5ec;margin:0 0 16px;">
            <p style="margin:0 0 4px;font-family:{fuente};font-size:12px;line-height:1.5;color:#555a6a;">DataHub · DataGlobal</p>
            <p style="margin:0;font-family:{fuente};font-size:12px;line-height:1.5;color:#555a6a;">Este es un correo automático, no respondas a este mensaje.</p>
            </td></tr>
            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """;
    }
}
