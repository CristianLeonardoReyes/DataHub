using Amazon;
using Amazon.Runtime;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using DataGlobal.DataHub.Common.Settings;
using MimeKit;

namespace DataGlobal.DataHub.Services.Correo;

/// <summary>Producción: Amazon SES. Usa las llaves de SesEmailSettings si existen; si no, la cadena estándar de AWS.</summary>
public class EnviadorCorreoSes(SesEmailSettings opciones) : IEnviadorCorreo
{
    public static MimeMessage CrearMensaje(SesEmailSettings o, string destino, string asunto, string html)
    {
        var mensaje = new MimeMessage();
        mensaje.From.Add(new MailboxAddress(o.Aws_from_name, o.Aws_from_address));
        if (!string.IsNullOrWhiteSpace(o.Aws_replyto_address))
            mensaje.ReplyTo.Add(MailboxAddress.Parse(o.Aws_replyto_address));
        mensaje.To.Add(MailboxAddress.Parse(destino));
        foreach (var bcc in o.Aws_bcc_addresses.Where(b => !string.IsNullOrWhiteSpace(b)))
            mensaje.Bcc.Add(MailboxAddress.Parse(bcc));
        mensaje.Subject = asunto;
        var cuerpo = new BodyBuilder { HtmlBody = html };
        var logo = cuerpo.LinkedResources.Add("logo-datahub.png", PlantillasCorreo.LogoPng, new ContentType("image", "png"));
        logo.ContentId = PlantillasCorreo.LogoCid;
        mensaje.Body = cuerpo.ToMessageBody();
        return mensaje;
    }

    public async Task EnviarAsync(string destino, string asunto, string html)
    {
        var mensaje = CrearMensaje(opciones, destino, asunto, html);

        using var datos = new MemoryStream();
        await mensaje.WriteToAsync(datos);
        datos.Position = 0;

        var region = RegionEndpoint.GetBySystemName(opciones.Region);
        using var cliente = !string.IsNullOrEmpty(opciones.Aws_access_key) && !string.IsNullOrEmpty(opciones.Aws_secret_key)
            ? new AmazonSimpleEmailServiceV2Client(new BasicAWSCredentials(opciones.Aws_access_key, opciones.Aws_secret_key), region)
            : new AmazonSimpleEmailServiceV2Client(region);

        var peticion = new SendEmailRequest
        {
            Content = new EmailContent { Raw = new RawMessage { Data = datos } },
            Destination = new Destination
            {
                ToAddresses = [destino],
                BccAddresses = mensaje.Bcc.Mailboxes.Select(m => m.Address).ToList()
            }
        };
        await cliente.SendEmailAsync(peticion);
    }
}
