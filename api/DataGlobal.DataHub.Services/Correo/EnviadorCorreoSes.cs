using Amazon;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using MimeKit;

namespace DataGlobal.DataHub.Services.Correo;

/// <summary>Producción: Amazon SES. Credenciales por la cadena estándar de AWS.</summary>
public class EnviadorCorreoSes(string remitente, string region) : IEnviadorCorreo
{
    public async Task EnviarAsync(string destino, string asunto, string html)
    {
        var mensaje = new MimeMessage();
        mensaje.From.Add(MailboxAddress.Parse(remitente));
        mensaje.To.Add(MailboxAddress.Parse(destino));
        mensaje.Subject = asunto;
        mensaje.Body = new BodyBuilder { HtmlBody = html }.ToMessageBody();

        using var datos = new MemoryStream();
        await mensaje.WriteToAsync(datos);
        datos.Position = 0;

        using var cliente = new AmazonSimpleEmailServiceV2Client(RegionEndpoint.GetBySystemName(region));
        await cliente.SendEmailAsync(new SendEmailRequest
        {
            Content = new EmailContent { Raw = new RawMessage { Data = datos } }
        });
    }
}
