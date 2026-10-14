namespace DataGlobal.DataHub.Services.Correo;

public interface IEnviadorCorreo
{
    Task EnviarAsync(string destino, string asunto, string html);
}
